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
 * Interceptors for PublicKeyCredential static methods.
 */

import { serializeBufferSource } from '../serializer';
import type { MessagePoster } from '../types';
import type { CallType } from '../../shared/types';

/**
 * Wraps a static method to intercept and report calls.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapStaticMethod<T>(
  methodName: CallType,
  originalMethod: ((...args: any[]) => Promise<T>) | undefined,
  postMessage: MessagePoster,
  generateId: () => string,
  serializeArgs?: (args: unknown[]) => unknown[]
): (...args: unknown[]) => Promise<T> {
  return async function (...args: unknown[]): Promise<T> {
    if (!originalMethod) {
      throw new Error(`${methodName} is not supported`);
    }

    const callId = generateId();
    const serializedArgs = serializeArgs ? serializeArgs(args) : args;

    // Notify start
    postMessage({
      type: 'CALL_START',
      data: {
        id: callId,
        callType: methodName,
        request: {
          method: methodName,
          args: serializedArgs,
        },
      },
    });

    try {
      const result = await originalMethod.apply(PublicKeyCredential, args);

      // Notify success
      postMessage({
        type: 'CALL_SUCCESS',
        data: {
          id: callId,
          response: {
            method: methodName,
            result,
          },
        },
      });

      return result;
    } catch (error) {
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

      throw error;
    }
  };
}

/**
 * Installs interceptors for PublicKeyCredential static methods.
 */
export function installStaticMethodInterceptors(
  postMessage: MessagePoster,
  generateId: () => string
): void {
  // isUserVerifyingPlatformAuthenticatorAvailable
  if (
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
    'function'
  ) {
    const original =
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.bind(
        PublicKeyCredential
      );
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      wrapStaticMethod<boolean>(
        'isUserVerifyingPlatformAuthenticatorAvailable',
        original,
        postMessage,
        generateId
      );
  }

  // isConditionalMediationAvailable
  if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
    const original =
      PublicKeyCredential.isConditionalMediationAvailable.bind(
        PublicKeyCredential
      );
    PublicKeyCredential.isConditionalMediationAvailable =
      wrapStaticMethod<boolean>(
        'isConditionalMediationAvailable',
        original,
        postMessage,
        generateId
      );
  }

  // getClientCapabilities (may not be available in all browsers)
  if (
    'getClientCapabilities' in PublicKeyCredential &&
    typeof (
      PublicKeyCredential as typeof PublicKeyCredential & {
        getClientCapabilities?: () => Promise<Record<string, boolean>>;
      }
    ).getClientCapabilities === 'function'
  ) {
    const PKC = PublicKeyCredential as typeof PublicKeyCredential & {
      getClientCapabilities: () => Promise<Record<string, boolean>>;
    };
    const original = PKC.getClientCapabilities.bind(PublicKeyCredential);
    PKC.getClientCapabilities = wrapStaticMethod<Record<string, boolean>>(
      'getClientCapabilities',
      original,
      postMessage,
      generateId
    );
  }

  // signalUnknownCredential (may not be available in all browsers)
  if (
    'signalUnknownCredential' in PublicKeyCredential &&
    typeof (
      PublicKeyCredential as typeof PublicKeyCredential & {
        signalUnknownCredential?: (options: {
          rpId: string;
          credentialId: ArrayBuffer;
        }) => Promise<void>;
      }
    ).signalUnknownCredential === 'function'
  ) {
    const PKC = PublicKeyCredential as typeof PublicKeyCredential & {
      signalUnknownCredential: (options: {
        rpId: string;
        credentialId: ArrayBuffer;
      }) => Promise<void>;
    };
    const original = PKC.signalUnknownCredential.bind(PublicKeyCredential);
    PKC.signalUnknownCredential = wrapStaticMethod<void>(
      'signalUnknownCredential',
      original,
      postMessage,
      generateId,
      (args) => {
        const options = args[0] as { rpId: string; credentialId: ArrayBuffer };
        return [
          {
            rpId: options.rpId,
            credentialId: serializeBufferSource(options.credentialId),
          },
        ];
      }
    );
  }

  // signalAllAcceptedCredentials (may not be available in all browsers)
  if (
    'signalAllAcceptedCredentials' in PublicKeyCredential &&
    typeof (
      PublicKeyCredential as typeof PublicKeyCredential & {
        signalAllAcceptedCredentials?: (options: {
          rpId: string;
          userId: ArrayBuffer;
          allAcceptedCredentialIds: ArrayBuffer[];
        }) => Promise<void>;
      }
    ).signalAllAcceptedCredentials === 'function'
  ) {
    const PKC = PublicKeyCredential as typeof PublicKeyCredential & {
      signalAllAcceptedCredentials: (options: {
        rpId: string;
        userId: ArrayBuffer;
        allAcceptedCredentialIds: ArrayBuffer[];
      }) => Promise<void>;
    };
    const original = PKC.signalAllAcceptedCredentials.bind(PublicKeyCredential);
    PKC.signalAllAcceptedCredentials = wrapStaticMethod<void>(
      'signalAllAcceptedCredentials',
      original,
      postMessage,
      generateId,
      (args) => {
        const options = args[0] as {
          rpId: string;
          userId: ArrayBuffer;
          allAcceptedCredentialIds: ArrayBuffer[];
        };
        return [
          {
            rpId: options.rpId,
            userId: serializeBufferSource(options.userId),
            allAcceptedCredentialIds: options.allAcceptedCredentialIds.map(
              (id) => serializeBufferSource(id)
            ),
          },
        ];
      }
    );
  }

  // signalCurrentUserDetails (may not be available in all browsers)
  if (
    'signalCurrentUserDetails' in PublicKeyCredential &&
    typeof (
      PublicKeyCredential as typeof PublicKeyCredential & {
        signalCurrentUserDetails?: (options: {
          rpId: string;
          userId: ArrayBuffer;
          name: string;
          displayName: string;
        }) => Promise<void>;
      }
    ).signalCurrentUserDetails === 'function'
  ) {
    const PKC = PublicKeyCredential as typeof PublicKeyCredential & {
      signalCurrentUserDetails: (options: {
        rpId: string;
        userId: ArrayBuffer;
        name: string;
        displayName: string;
      }) => Promise<void>;
    };
    const original = PKC.signalCurrentUserDetails.bind(PublicKeyCredential);
    PKC.signalCurrentUserDetails = wrapStaticMethod<void>(
      'signalCurrentUserDetails',
      original,
      postMessage,
      generateId,
      (args) => {
        const options = args[0] as {
          rpId: string;
          userId: ArrayBuffer;
          name: string;
          displayName: string;
        };
        return [
          {
            rpId: options.rpId,
            userId: serializeBufferSource(options.userId),
            name: options.name,
            displayName: options.displayName,
          },
        ];
      }
    );
  }
}
