/**
 * Copyright 2025 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Background service worker for WebAuthn DevTools extension.
 */

// Browser polyfill (inline) - Chrome uses `chrome`, Firefox/Safari use `browser`
// @ts-expect-error - We're intentionally creating a global
if (typeof globalThis.browser === 'undefined' && typeof globalThis.chrome !== 'undefined') {
  // @ts-expect-error - Assigning chrome to browser for cross-browser compatibility
  globalThis.browser = globalThis.chrome;
}

import { stateManager } from './state';
import { connectionManager } from './connections';
import type { RuntimeMessage, RuntimePayload } from '../shared/messages';
import type { WebAuthnCall } from '../shared/types';

/**
 * Handle messages from content scripts and DevTools panels.
 */
browser.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    if (message.source !== 'webauthn-devtools') {
      return;
    }

    // Handle OPEN_URL separately since it doesn't require a tabId
    if (message.payload.type === 'OPEN_URL') {
      browser.tabs.create({ url: message.payload.url });
      return;
    }

    const tabId = sender.tab?.id || message.tabId;

    if (!tabId) {
      return;
    }

    handleMessage(tabId, message.payload, sendResponse);
    return true; // Keep the message channel open for async responses
  }
);

/**
 * Handle DevTools panel connections.
 */
browser.runtime.onConnect.addListener((port) => {
  if (port.name !== 'webauthn-devtools-panel') {
    return;
  }

  port.onMessage.addListener((message: RuntimeMessage) => {
    if (message.source !== 'webauthn-devtools') {
      return;
    }

    const tabId = message.tabId;
    if (!tabId) {
      return;
    }

    // Register the connection
    if (message.payload.type === 'PANEL_OPENED') {
      connectionManager.addConnection(tabId, port);

      // Safari workaround: tabId=-1 means we need to query the active tab
      if (tabId === -1) {
        // IMMEDIATELY send empty response before Safari kills the port
        try {
          port.postMessage({ source: 'webauthn-devtools', payload: { type: 'CALLS_UPDATE', calls: [] } });
        } catch {
          // Port may already be disconnected
        }

        // Then try to get real data (may or may not work due to Safari port issues)
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.id) {
            const calls = stateManager.getCalls(activeTab.id);
            if (calls.length > 0) {
              try {
                port.postMessage({ source: 'webauthn-devtools', payload: { type: 'CALLS_UPDATE', calls } });
              } catch {
                connectionManager.sendToPanel(-1, { type: 'CALLS_UPDATE', calls });
              }
            }

            // Activate content script
            browser.tabs.sendMessage(activeTab.id, { type: 'ACTIVATE_TAB' }).catch(() => {});
          }
        });
      } else {
        // Normal Chrome mode - send calls for the specific tab
        const calls = stateManager.getCalls(tabId);
        connectionManager.sendToPanel(tabId, { type: 'CALLS_UPDATE', calls });

        browser.tabs.sendMessage(tabId, { type: 'ACTIVATE_TAB' }).catch(() => {});
      }
    }
  });
});

/**
 * Clean up when tabs are closed.
 */
browser.tabs.onRemoved.addListener((tabId) => {
  stateManager.deleteTab(tabId);
  connectionManager.removeConnection(tabId);
});

// Note: Calls are preserved across page navigations.
// Users can manually clear calls using the Clear button in the panel.

/**
 * Handle incoming messages based on type.
 */
function handleMessage(
  tabId: number,
  payload: RuntimePayload,
  sendResponse: (response?: unknown) => void
): void {
  switch (payload.type) {
    case 'WEBAUTHN_CALL_START':
      handleCallStart(tabId, payload.data);
      break;

    case 'WEBAUTHN_CALL_SUCCESS':
      handleCallSuccess(tabId, payload.data.id, payload.data.response);
      break;

    case 'WEBAUTHN_CALL_ERROR':
      handleCallError(tabId, payload.data.id, payload.data.error);
      break;

    case 'WEBAUTHN_CALL_ABORT':
      handleCallAbort(tabId, payload.data.id);
      break;

    case 'GET_CALLS':
      // Safari workaround: if tabId is -1, query the active tab
      if (tabId === -1) {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.id) {
            const calls = stateManager.getCalls(activeTab.id);
            sendResponse({ calls });
          } else {
            sendResponse({ calls: [] });
          }
        });
      } else {
        const calls = stateManager.getCalls(tabId);
        sendResponse({ calls });
      }
      break;

    case 'CLEAR_CALLS':
      // Safari workaround: if tabId is -1, query the active tab
      if (tabId === -1) {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.id) {
            stateManager.clearCalls(activeTab.id);
          }
        });
      } else {
        stateManager.clearCalls(tabId);
      }
      break;

    case 'PANEL_CLOSED':
      connectionManager.removeConnection(tabId);
      break;

    case 'CONTENT_READY':
      // If panel is already open for this tab, activate the content script
      if (connectionManager.hasConnection(tabId)) {
        browser.tabs.sendMessage(tabId, { type: 'ACTIVATE_TAB' }).catch(() => {
          // Content script may not be ready yet
        });
      }
      break;

    default:
      // Unknown message type
      break;
  }
}

/**
 * Handle the start of a WebAuthn call.
 */
function handleCallStart(
  tabId: number,
  data: { id: string; callType: string; request: unknown }
): void {
  const call: WebAuthnCall = {
    id: data.id,
    type: data.callType as WebAuthnCall['type'],
    status: 'pending',
    timestamp: Date.now(),
    request: data.request as WebAuthnCall['request'],
  };

  stateManager.addCall(tabId, call);
  notifyPanel(tabId);
}

/**
 * Handle a successful WebAuthn call.
 */
function handleCallSuccess(
  tabId: number,
  callId: string,
  response: unknown
): void {
  const state = stateManager.getState(tabId);
  const call = state.calls.find((c) => c.id === callId);

  if (call) {
    stateManager.updateCall(tabId, callId, {
      status: 'success',
      duration: Date.now() - call.timestamp,
      response: response as WebAuthnCall['response'],
    });
    notifyPanel(tabId);
  }
}

/**
 * Handle a failed WebAuthn call.
 */
function handleCallError(
  tabId: number,
  callId: string,
  error: { name: string; message: string; stack?: string }
): void {
  const state = stateManager.getState(tabId);
  const call = state.calls.find((c) => c.id === callId);

  if (call) {
    stateManager.updateCall(tabId, callId, {
      status: 'error',
      duration: Date.now() - call.timestamp,
      error,
    });
    notifyPanel(tabId);
  }
}

/**
 * Handle an aborted WebAuthn call.
 */
function handleCallAbort(tabId: number, callId: string): void {
  const state = stateManager.getState(tabId);
  const call = state.calls.find((c) => c.id === callId);

  if (call) {
    stateManager.updateCall(tabId, callId, {
      status: 'aborted',
      duration: Date.now() - call.timestamp,
    });
    notifyPanel(tabId);
  }
}

/**
 * Notify the DevTools panel of state changes.
 */
function notifyPanel(tabId: number): void {
  const calls = stateManager.getCalls(tabId);
  connectionManager.sendToPanel(tabId, { type: 'CALLS_UPDATE', calls });

  // Safari workaround: also send to any panels registered with tabId=-1
  // since Safari doesn't provide real tabIds to devtools panels
  if (tabId !== -1 && connectionManager.hasConnection(-1)) {
    connectionManager.sendToPanel(-1, { type: 'CALLS_UPDATE', calls });
  }
}

// Log that the service worker has started
console.log('WebAuthn DevTools: Background service worker started');
