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
 * Serialization utilities for WebAuthn data.
 * Converts ArrayBuffers to base64url strings for message passing.
 */

/**
 * Converts an ArrayBuffer to a base64url-encoded string.
 * Base64url uses URL-safe characters: - instead of +, _ instead of /
 * No padding characters (=) are included.
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) {
    return '';
  }

  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Converts a base64url-encoded string back to an ArrayBuffer.
 * Handles strings without padding and with URL-safe characters.
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  if (base64url.length === 0) {
    return new ArrayBuffer(0);
  }

  // Convert base64url to standard base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if necessary
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(paddingNeeded);

  // Decode
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Serializes a BufferSource (ArrayBuffer or ArrayBufferView) to base64url.
 */
export function serializeBufferSource(
  buffer: BufferSource | undefined
): string | undefined {
  if (!buffer) {
    return undefined;
  }

  if (buffer instanceof ArrayBuffer) {
    return arrayBufferToBase64Url(buffer);
  }

  // Handle ArrayBufferView (like Uint8Array)
  // Verify it's actually an ArrayBufferView by checking .buffer exists
  // Must check typeof first since 'in' operator throws on primitives
  if (
    typeof buffer === 'object' &&
    buffer !== null &&
    'buffer' in buffer &&
    buffer.buffer instanceof ArrayBuffer
  ) {
    return arrayBufferToBase64Url(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      )
    );
  }

  // Unknown type (string, number, etc.) - return undefined
  return undefined;
}

/**
 * Serializes credential descriptors (excludeCredentials, allowCredentials).
 */
export function serializeCredentialDescriptors(
  descriptors: PublicKeyCredentialDescriptor[] | undefined
): Array<{ type: string; id: string; transports?: string[] }> | undefined {
  if (!descriptors || descriptors.length === 0) {
    return undefined;
  }

  return descriptors.map((desc) => ({
    type: desc.type,
    id: serializeBufferSource(desc.id) || '',
    transports: desc.transports as string[] | undefined,
  }));
}

/**
 * Serializes a PublicKeyCredentialCreationOptions request.
 */
export function serializeCreateRequest(
  options: PublicKeyCredentialCreationOptions
): Record<string, unknown> {
  // `hints` is a newer WebAuthn field that may not be present in the installed
  // TypeScript lib.dom.d.ts. Access it via a cast to avoid type errors while
  // still capturing it when the page passes it.
  const hints = (options as PublicKeyCredentialCreationOptions & {
    hints?: string[];
  }).hints;

  return {
    rp: {
      id: options.rp.id,
      name: options.rp.name,
    },
    user: {
      id: serializeBufferSource(options.user.id),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: serializeBufferSource(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams.map((param) => ({
      type: param.type,
      alg: param.alg,
    })),
    timeout: options.timeout,
    excludeCredentials: serializeCredentialDescriptors(
      options.excludeCredentials
    ),
    authenticatorSelection: options.authenticatorSelection,
    hints: Array.isArray(hints) ? [...hints] : undefined,
    attestation: options.attestation,
    extensions: options.extensions,
  };
}

/**
 * Serializes a PublicKeyCredentialRequestOptions request.
 */
export function serializeGetRequest(
  options: PublicKeyCredentialRequestOptions,
  mediation?: CredentialMediationRequirement
): Record<string, unknown> {
  // `hints` is a newer WebAuthn field that may not be present in the installed
  // TypeScript lib.dom.d.ts. Access it via a cast to avoid type errors while
  // still capturing it when the page passes it.
  const hints = (options as PublicKeyCredentialRequestOptions & {
    hints?: string[];
  }).hints;

  return {
    rpId: options.rpId,
    challenge: serializeBufferSource(options.challenge),
    timeout: options.timeout,
    allowCredentials: serializeCredentialDescriptors(options.allowCredentials),
    userVerification: options.userVerification,
    hints: Array.isArray(hints) ? [...hints] : undefined,
    extensions: options.extensions,
    mediation,
  };
}

/**
 * Serializes a PublicKeyCredential response from create().
 */
export function serializeCreateResponse(
  credential: PublicKeyCredential
): Record<string, unknown> {
  const response =
    credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: serializeBufferSource(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: serializeBufferSource(response.clientDataJSON),
      attestationObject: serializeBufferSource(response.attestationObject),
      transports:
        typeof response.getTransports === 'function'
          ? response.getTransports()
          : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/**
 * Serializes a PublicKeyCredential response from get().
 */
export function serializeGetResponse(
  credential: PublicKeyCredential
): Record<string, unknown> {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: serializeBufferSource(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: serializeBufferSource(response.clientDataJSON),
      authenticatorData: serializeBufferSource(response.authenticatorData),
      signature: serializeBufferSource(response.signature),
      userHandle: response.userHandle
        ? serializeBufferSource(response.userHandle)
        : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}
