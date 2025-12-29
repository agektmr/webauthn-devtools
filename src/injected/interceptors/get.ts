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
 * Interceptor for navigator.credentials.get() WebAuthn calls.
 */

import { serializeGetRequest, serializeGetResponse } from '../serializer';
import type { MessagePoster } from '../types';

/**
 * Installs the get() interceptor on the CredentialsContainer.
 */
export function installGetInterceptor(
  postMessage: MessagePoster,
  generateId: () => string
): void {
  const originalGet = navigator.credentials.get.bind(navigator.credentials);

  navigator.credentials.get = async function (
    options?: CredentialRequestOptions
  ): Promise<Credential | null> {
    // Only intercept WebAuthn calls (those with publicKey options)
    if (!options?.publicKey) {
      return originalGet(options);
    }

    const callId = generateId();
    const serializedRequest = serializeGetRequest(
      options.publicKey,
      options.mediation
    );

    // Notify start
    postMessage({
      type: 'CALL_START',
      data: {
        id: callId,
        callType: 'get',
        request: serializedRequest,
      },
    });

    try {
      const credential = await originalGet(options);

      if (credential && credential instanceof PublicKeyCredential) {
        // Notify success
        postMessage({
          type: 'CALL_SUCCESS',
          data: {
            id: callId,
            response: serializeGetResponse(credential),
          },
        });
      } else {
        // Null result (user cancelled or no credential)
        postMessage({
          type: 'CALL_SUCCESS',
          data: {
            id: callId,
            response: null,
          },
        });
      }

      return credential;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Aborted
        postMessage({
          type: 'CALL_ABORT',
          data: { id: callId },
        });
      } else {
        // Error
        const errorInfo =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : {
                name: 'UnknownError',
                message: String(error),
              };

        postMessage({
          type: 'CALL_ERROR',
          data: {
            id: callId,
            error: errorInfo,
          },
        });
      }

      throw error;
    }
  };
}
