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
 * Documentation links for WebAuthn concepts.
 */

export interface DocLink {
  /** Short label for the tooltip */
  label: string;
  /** Brief description shown in the tooltip */
  description: string;
  /** URL to the documentation */
  url: string;
}

/**
 * Mapping of WebAuthn concepts to their documentation.
 */
export const DOC_LINKS: Record<string, DocLink> = {
  // User Verification
  userVerification: {
    label: 'User Verification',
    description: 'Understand UV requirements and how to configure them for your use case.',
    url: 'https://web.dev/articles/webauthn-user-verification',
  },

  // Discoverable Credentials
  discoverableCredentials: {
    label: 'Discoverable Credentials',
    description: 'Learn about passkeys and resident credentials stored on authenticators.',
    url: 'https://web.dev/articles/webauthn-discoverable-credentials',
  },

  allowCredentials: {
    label: 'allowCredentials',
    description: 'Control which credentials the user can authenticate with.',
    url: 'https://web.dev/articles/webauthn-discoverable-credentials',
  },

  residentKey: {
    label: 'Discoverable Credentials',
    description: 'Configure whether credentials should be stored on the authenticator.',
    url: 'https://web.dev/articles/webauthn-discoverable-credentials',
  },

  requireResidentKey: {
    label: 'Discoverable Credentials',
    description: 'Legacy option for requiring discoverable credentials.',
    url: 'https://web.dev/articles/webauthn-discoverable-credentials',
  },

  // Exclude Credentials
  excludeCredentials: {
    label: 'excludeCredentials',
    description: 'Prevent creating duplicate credentials for the same account.',
    url: 'https://web.dev/articles/webauthn-exclude-credentials',
  },

  // AAGUID
  aaguid: {
    label: 'AAGUID',
    description: 'Authenticator identifier that helps identify the make and model.',
    url: 'https://web.dev/articles/webauthn-aaguid',
  },

  // Signal API
  signalUnknownCredential: {
    label: 'Signal API',
    description: 'Notify the authenticator when a credential is not recognized.',
    url: 'https://developer.chrome.com/docs/identity/webauthn-signal-api',
  },

  signalAllAcceptedCredentials: {
    label: 'Signal API',
    description: 'Update the authenticator with the list of valid credentials.',
    url: 'https://developer.chrome.com/docs/identity/webauthn-signal-api',
  },

  signalCurrentUserDetails: {
    label: 'Signal API',
    description: 'Update user information stored on the authenticator.',
    url: 'https://developer.chrome.com/docs/identity/webauthn-signal-api',
  },

  // getClientCapabilities
  getClientCapabilities: {
    label: 'getClientCapabilities',
    description: 'Check what WebAuthn features are supported by the browser.',
    url: 'https://web.dev/articles/webauthn-client-capabilities',
  },

  // Conditional UI / Mediation
  'mediation:conditional': {
    label: 'Conditional UI',
    description: 'Enable passkey autofill suggestions in login forms.',
    url: 'https://developer.chrome.com/docs/identity/webauthn-conditional-create',
  },
};

/**
 * Get documentation link for a WebAuthn concept.
 * @param key - The concept key (property name or method name)
 * @returns Documentation link info or undefined if not found
 */
export function getDocLink(key: string): DocLink | undefined {
  return DOC_LINKS[key];
}

/**
 * Check if a concept has documentation available.
 * @param key - The concept key
 * @returns true if documentation exists
 */
export function hasDocLink(key: string): boolean {
  return key in DOC_LINKS;
}
