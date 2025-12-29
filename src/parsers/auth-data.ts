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
 * Parser for WebAuthn authenticator data.
 *
 * AuthData structure:
 * - rpIdHash (32 bytes): SHA-256 hash of the RP ID
 * - flags (1 byte): Bit flags
 * - signCount (4 bytes): Signature counter, big-endian
 * - attestedCredentialData (variable): Present if AT flag is set
 * - extensions (variable): Present if ED flag is set
 */

import { decode } from 'cbor-x';
import type { ParsedAuthData, AuthDataFlags } from '../shared/types';
import { parseCoseKey, getCoseKeyLength } from './cose-key';
import { arrayBufferToBase64Url } from '../injected/serializer';

/**
 * Converts a Uint8Array to a hex string.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Formats a 16-byte array as a UUID string.
 */
function formatUUID(bytes: Uint8Array): string {
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Parses the flags byte from authenticator data.
 */
function parseFlags(flagsByte: number): AuthDataFlags {
  return {
    UP: Boolean(flagsByte & 0x01), // Bit 0
    UV: Boolean(flagsByte & 0x04), // Bit 2
    BE: Boolean(flagsByte & 0x08), // Bit 3
    BS: Boolean(flagsByte & 0x10), // Bit 4
    AT: Boolean(flagsByte & 0x40), // Bit 6
    ED: Boolean(flagsByte & 0x80), // Bit 7
    raw: flagsByte,
  };
}

/**
 * Parses authenticator data from a WebAuthn response.
 */
export function parseAuthData(buffer: ArrayBuffer): ParsedAuthData {
  const data = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  // rpIdHash (32 bytes)
  const rpIdHash = bytesToHex(bytes.slice(offset, offset + 32));
  offset += 32;

  // flags (1 byte)
  const flagsByte = data.getUint8(offset);
  const flags = parseFlags(flagsByte);
  offset += 1;

  // signCount (4 bytes, big-endian)
  const signCount = data.getUint32(offset, false);
  offset += 4;

  const result: ParsedAuthData = {
    rpIdHash,
    flags,
    signCount,
  };

  // attestedCredentialData (variable, if AT flag is set)
  if (flags.AT) {
    // aaguid (16 bytes)
    const aaguidBytes = bytes.slice(offset, offset + 16);
    const aaguid = formatUUID(aaguidBytes);
    offset += 16;

    // credentialIdLength (2 bytes, big-endian)
    const credentialIdLength = data.getUint16(offset, false);
    offset += 2;

    // credentialId (credentialIdLength bytes)
    const credentialIdBytes = bytes.slice(offset, offset + credentialIdLength);
    const credentialId = arrayBufferToBase64Url(credentialIdBytes.buffer);
    offset += credentialIdLength;

    // credentialPublicKey (CBOR, variable length)
    const remainingBytes = bytes.slice(offset);
    const publicKey = parseCoseKey(remainingBytes.buffer);
    const keyLength = getCoseKeyLength(remainingBytes.buffer);
    offset += keyLength;

    result.attestedCredentialData = {
      aaguid,
      credentialId,
      publicKey,
    };
  }

  // extensions (CBOR, if ED flag is set)
  if (flags.ED && offset < bytes.length) {
    const extensionsBytes = bytes.slice(offset);
    try {
      result.extensions = decode(extensionsBytes) as Record<string, unknown>;
    } catch {
      // If CBOR parsing fails, store raw bytes info
      result.extensions = { _raw: bytesToHex(extensionsBytes) };
    }
  }

  return result;
}
