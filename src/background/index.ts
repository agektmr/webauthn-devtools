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

import { stateManager } from './state';
import { connectionManager } from './connections';
import { cdpClient } from './cdp';
import type { RuntimeMessage, RuntimePayload } from '../shared/messages';
import type { WebAuthnCall } from '../shared/types';

/**
 * Handle messages from content scripts and DevTools panels.
 */
chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    if (message.source !== 'webauthn-devtools') {
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
chrome.runtime.onConnect.addListener((port) => {
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
      // Send current state to the newly connected panel
      const calls = stateManager.getCalls(tabId);
      connectionManager.sendToPanel(tabId, { type: 'CALLS_UPDATE', calls });
    }
  });
});

/**
 * Clean up when tabs are closed.
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  stateManager.deleteTab(tabId);
  connectionManager.removeConnection(tabId);
  cdpClient.detach(tabId);
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
      sendResponse(stateManager.getCalls(tabId));
      break;

    case 'CLEAR_CALLS':
      stateManager.clearCalls(tabId);
      break;

    case 'GET_VIRTUAL_AUTH_STATUS':
      cdpClient.checkVirtualAuthStatus(tabId).then((status) => {
        sendResponse(status);
        connectionManager.sendToPanel(tabId, {
          type: 'VIRTUAL_AUTH_STATUS',
          enabled: status.enabled,
          authenticators: status.authenticators,
        });
      });
      break;

    case 'PANEL_CLOSED':
      connectionManager.removeConnection(tabId);
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
}

// Log that the service worker has started
console.log('WebAuthn DevTools: Background service worker started');
