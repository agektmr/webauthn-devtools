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
 * COSE Algorithm identifiers and their human-readable names
 * @see https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export const COSE_ALG_NAMES: Record<number, string> = {
  // ECDSA
  [-7]: 'ES256',
  [-35]: 'ES384',
  [-36]: 'ES512',

  // EdDSA
  [-8]: 'EdDSA',

  // RSA
  [-257]: 'RS256',
  [-258]: 'RS384',
  [-259]: 'RS512',
  [-37]: 'PS256',
  [-38]: 'PS384',
  [-39]: 'PS512',
};

/**
 * COSE Key Type identifiers
 * @see https://www.iana.org/assignments/cose/cose.xhtml#key-type
 */
export const COSE_KTY_NAMES: Record<number, string> = {
  1: 'OKP',
  2: 'EC2',
  3: 'RSA',
};

/**
 * COSE Elliptic Curve identifiers
 * @see https://www.iana.org/assignments/cose/cose.xhtml#elliptic-curves
 */
export const COSE_CRV_NAMES: Record<number, string> = {
  1: 'P-256',
  2: 'P-384',
  3: 'P-521',
  6: 'Ed25519',
  7: 'Ed448',
};

/**
 * WebAuthn error types and descriptions
 */
export const WEBAUTHN_ERRORS: Record<string, string> = {
  NotAllowedError:
    'The request was denied by the user or the authenticator, or the operation timed out.',
  InvalidStateError:
    'The authenticator already has a credential for this relying party/user combination.',
  NotSupportedError:
    'The request is not supported by the authenticator or the browser.',
  SecurityError:
    'The operation was not allowed due to security restrictions.',
  AbortError:
    'The operation was aborted.',
  UnknownError:
    'An unknown error occurred.',
};

/**
 * Message source identifiers
 */
export const MESSAGE_SOURCE = {
  INJECTED: 'webauthn-devtools-injected',
  CONTENT: 'webauthn-devtools-content',
  BACKGROUND: 'webauthn-devtools-background',
  PANEL: 'webauthn-devtools-panel',
} as const;
