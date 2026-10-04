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
 * Message protocol definitions for WebAuthn DevTools Extension
 */

import type {
  CallType,
  ErrorInfo,
  WebAuthnCall,
} from './types';

/**
 * Messages from injected script to content script (via window.postMessage)
 */
export interface InjectedMessage {
  source: 'webauthn-devtools-injected';
  payload: InjectedPayload;
}

export type InjectedPayload =
  | { type: 'CALL_START'; data: CallStartData }
  | { type: 'CALL_SUCCESS'; data: CallSuccessData }
  | { type: 'CALL_ERROR'; data: CallErrorData }
  | { type: 'CALL_ABORT'; data: CallAbortData };

export interface CallStartData {
  id: string;
  callType: CallType;
  request: unknown;
}

export interface CallSuccessData {
  id: string;
  response: unknown;
}

export interface CallErrorData {
  id: string;
  error: ErrorInfo;
}

export interface CallAbortData {
  id: string;
}

/**
 * Messages between content script and service worker (via chrome.runtime)
 */
export interface RuntimeMessage {
  source: 'webauthn-devtools';
  tabId?: number;
  payload: RuntimePayload;
}

export type RuntimePayload =
  // From content script
  | { type: 'CONTENT_READY' }
  | { type: 'WEBAUTHN_CALL_START'; data: CallStartData }
  | { type: 'WEBAUTHN_CALL_SUCCESS'; data: CallSuccessData }
  | { type: 'WEBAUTHN_CALL_ERROR'; data: CallErrorData }
  | { type: 'WEBAUTHN_CALL_ABORT'; data: CallAbortData }
  // From DevTools panel
  | { type: 'PANEL_OPENED'; tabId: number }
  | { type: 'PANEL_CLOSED'; tabId: number }
  | { type: 'CLEAR_CALLS'; tabId: number }
  | { type: 'GET_CALLS'; tabId: number }
  | { type: 'OPEN_URL'; url: string }
  // From service worker to panel
  | { type: 'CALLS_UPDATE'; calls: WebAuthnCall[] }
  // From service worker to content script
  | { type: 'ACTIVATE_TAB' };

/**
 * Type guard for InjectedMessage
 */
export function isInjectedMessage(
  message: unknown
): message is InjectedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'source' in message &&
    (message as InjectedMessage).source === 'webauthn-devtools-injected'
  );
}

/**
 * Type guard for RuntimeMessage
 */
export function isRuntimeMessage(
  message: unknown
): message is RuntimeMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'source' in message &&
    (message as RuntimeMessage).source === 'webauthn-devtools'
  );
}
