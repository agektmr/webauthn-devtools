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
 * Content script that bridges the injected script and the background service worker.
 *
 * Responsibilities:
 * - Inject the interceptor script into the page context
 * - Listen for WebAuthn call events from the injected script
 * - Relay messages to the background service worker
 */

import { isInjectedMessage } from '../shared/messages';
import type { InjectedPayload } from '../shared/messages';
import type { RuntimeMessage, RuntimePayload } from '../shared/messages';

/**
 * Inject the interceptor script into the page context.
 * This must run at document_start to intercept WebAuthn calls before page scripts.
 */
function injectScript(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

/**
 * Convert an injected script payload to a runtime payload for the background.
 */
function convertPayload(payload: InjectedPayload): RuntimePayload {
  switch (payload.type) {
    case 'CALL_START':
      return { type: 'WEBAUTHN_CALL_START', data: payload.data };
    case 'CALL_SUCCESS':
      return { type: 'WEBAUTHN_CALL_SUCCESS', data: payload.data };
    case 'CALL_ERROR':
      return { type: 'WEBAUTHN_CALL_ERROR', data: payload.data };
    case 'CALL_ABORT':
      return { type: 'WEBAUTHN_CALL_ABORT', data: payload.data };
  }
}

/**
 * Send a message to the background service worker.
 */
function sendToBackground(payload: RuntimePayload): void {
  const message: RuntimeMessage = {
    source: 'webauthn-devtools',
    payload,
  };

  chrome.runtime.sendMessage(message).catch(() => {
    // Extension context may be invalidated if extension is reloaded
    // Silently ignore these errors
  });
}

/**
 * Handle messages from the injected script.
 */
function handleWindowMessage(event: MessageEvent): void {
  // Only accept messages from the same window
  if (event.source !== window) {
    return;
  }

  // Validate the message structure
  if (!isInjectedMessage(event.data)) {
    return;
  }

  // Convert and relay to background
  const runtimePayload = convertPayload(event.data.payload);
  sendToBackground(runtimePayload);
}

// Track injection state to avoid double-injection
let injected = false;

/**
 * Listen for activation from background service worker.
 */
chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'ACTIVATE_TAB' && !injected) {
    injected = true;
    injectScript();
  }
});

// Notify background that content script is ready for activation
chrome.runtime.sendMessage({
  source: 'webauthn-devtools',
  payload: { type: 'CONTENT_READY' },
} as RuntimeMessage).catch(() => {
  // Extension context may be invalidated if extension is reloaded
});

// Listen for WebAuthn events from injected script (will only receive if injected)
window.addEventListener('message', handleWindowMessage);
