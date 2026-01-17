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
 * - Inject the interceptor script into the page context (only when DevTools panel is open)
 * - Listen for WebAuthn call events from the injected script
 * - Relay messages to the background service worker
 */

// Browser polyfill (inline) - Chrome uses `chrome`, Firefox/Safari use `browser`
// @ts-expect-error - We're intentionally creating a global
if (typeof globalThis.browser === 'undefined' && typeof globalThis.chrome !== 'undefined') {
  // @ts-expect-error - Assigning chrome to browser for cross-browser compatibility
  globalThis.browser = globalThis.chrome;
}

import { isInjectedMessage } from '../shared/messages';
import type { InjectedPayload } from '../shared/messages';
import type { RuntimeMessage, RuntimePayload } from '../shared/messages';

/**
 * Inject the interceptor script into the page context.
 * This must run at document_start to intercept WebAuthn calls before page scripts.
 */
function injectScript(): void {
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('injected.js');
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

  browser.runtime.sendMessage(message).catch(() => {
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
// Use globalThis to survive Safari content script reloads (let can't be redeclared)
declare global {
  // eslint-disable-next-line no-var
  var __webauthnDevtoolsInjected: boolean | undefined;
}

/**
 * Inject the script if not already injected.
 */
function activateIfNeeded(): void {
  if (!globalThis.__webauthnDevtoolsInjected) {
    globalThis.__webauthnDevtoolsInjected = true;
    injectScript();
  }
}

/**
 * Detect Safari by checking if certain Safari-specific features exist.
 * Safari's browser.tabs.sendMessage is unreliable, so we inject immediately for Safari.
 */
function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Safari: Inject immediately because ACTIVATE_TAB messaging is unreliable
// Chrome/Firefox: Wait for ACTIVATE_TAB from background (when DevTools panel opens)
if (isSafari()) {
  activateIfNeeded();
}

/**
 * Listen for activation from background service worker.
 * The background sends ACTIVATE_TAB when the DevTools panel is opened.
 * For Chrome/Firefox: User must reload the page after opening DevTools to start capturing.
 * For Safari: Injects immediately (above) since messaging is unreliable.
 */
browser.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'ACTIVATE_TAB') {
    activateIfNeeded();
  }
});

// Notify background that content script is ready
browser.runtime.sendMessage({
  source: 'webauthn-devtools',
  payload: { type: 'CONTENT_READY' },
} as RuntimeMessage).catch(() => {
  // Extension context may be invalidated
});

// Listen for WebAuthn events from injected script
window.addEventListener('message', handleWindowMessage);
