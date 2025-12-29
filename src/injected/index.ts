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
 * Injected script that intercepts WebAuthn API calls.
 *
 * This script is injected into the page context to intercept calls to:
 * - navigator.credentials.create()
 * - navigator.credentials.get()
 * - PublicKeyCredential static methods
 *
 * Intercepted calls are reported to the content script via window.postMessage.
 */

import { installCreateInterceptor } from './interceptors/create';
import { installGetInterceptor } from './interceptors/get';
import { installStaticMethodInterceptors } from './interceptors/static-methods';
import type { InjectedPayload } from '../shared/messages';

/**
 * Generates a unique call ID.
 */
function generateCallId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Posts a message to the content script.
 */
function postToContentScript(payload: InjectedPayload): void {
  window.postMessage(
    {
      source: 'webauthn-devtools-injected',
      payload,
    },
    '*'
  );
}

/**
 * Install all interceptors.
 */
function install(): void {
  // Check if WebAuthn is available
  if (typeof navigator.credentials === 'undefined') {
    console.log('WebAuthn DevTools: Credentials API not available');
    return;
  }

  if (typeof PublicKeyCredential === 'undefined') {
    console.log('WebAuthn DevTools: PublicKeyCredential not available');
    return;
  }

  // Install interceptors
  installCreateInterceptor(postToContentScript, generateCallId);
  installGetInterceptor(postToContentScript, generateCallId);
  installStaticMethodInterceptors(postToContentScript, generateCallId);

  console.log('WebAuthn DevTools: Interceptors installed');
}

// Install immediately
install();
