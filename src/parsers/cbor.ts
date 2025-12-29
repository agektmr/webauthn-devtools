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
 * CBOR decoding utilities for WebAuthn attestation objects.
 */

import { decode } from 'cbor-x';
import type { ParsedAttestationObject } from '../shared/types';
import { parseAuthData } from './auth-data';

/**
 * Decodes a CBOR-encoded buffer.
 */
export function decodeCbor<T = unknown>(buffer: ArrayBuffer): T {
  return decode(new Uint8Array(buffer)) as T;
}

/**
 * Parses an attestationObject from a WebAuthn registration response.
 * The attestationObject is CBOR-encoded and contains:
 * - fmt: attestation statement format
 * - attStmt: attestation statement
 * - authData: authenticator data
 */
export function parseAttestationObject(
  buffer: ArrayBuffer
): ParsedAttestationObject {
  const decoded = decodeCbor<{
    fmt: string;
    attStmt: Record<string, unknown>;
    authData: Uint8Array;
  }>(buffer);

  // The authData from cbor-x is a Uint8Array that may share a buffer
  // with other data, so we need to slice it to get a clean copy
  const authDataBytes = new Uint8Array(decoded.authData);
  const authDataBuffer = authDataBytes.buffer.slice(
    authDataBytes.byteOffset,
    authDataBytes.byteOffset + authDataBytes.byteLength
  );

  return {
    fmt: decoded.fmt,
    attStmt: decoded.attStmt,
    authData: parseAuthData(authDataBuffer),
  };
}
