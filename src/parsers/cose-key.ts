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
 * Parser for COSE public keys used in WebAuthn.
 *
 * COSE Key structure is defined in RFC 8152.
 * Common key types:
 * - EC2 (kty=2): Elliptic curve keys (ES256, ES384, ES512)
 * - RSA (kty=3): RSA keys (RS256, RS384, RS512, PS256, etc.)
 * - OKP (kty=1): Octet Key Pair (EdDSA)
 */

import { decode } from 'cbor-x';
import type { ParsedCoseKey } from '../shared/types';
import { COSE_ALG_NAMES, COSE_KTY_NAMES, COSE_CRV_NAMES } from '../shared/constants';
import { arrayBufferToBase64Url } from '../injected/serializer';

// COSE key parameter labels (as string keys since cbor-x uses object notation)
const COSE_KEY_KTY = '1';
const COSE_KEY_ALG = '3';
const COSE_KEY_CRV = '-1';
const COSE_KEY_X = '-2';
const COSE_KEY_Y = '-3';

// Type for decoded COSE key object
interface DecodedCoseKey {
  [key: string]: unknown;
}

/**
 * Parses a COSE public key from a CBOR-encoded buffer.
 */
export function parseCoseKey(buffer: ArrayBuffer): ParsedCoseKey {
  const decoded = decode(new Uint8Array(buffer)) as DecodedCoseKey;

  const kty = decoded[COSE_KEY_KTY] as number;
  const alg = decoded[COSE_KEY_ALG] as number;

  const result: ParsedCoseKey = {
    kty,
    ktyName: COSE_KTY_NAMES[kty] || `Unknown (${kty})`,
    alg,
    algName: COSE_ALG_NAMES[alg] || `Unknown (${alg})`,
  };

  // Handle EC2 keys (ECDSA)
  if (kty === 2) {
    const crv = decoded[COSE_KEY_CRV] as number;
    const x = decoded[COSE_KEY_X] as Uint8Array;
    const y = decoded[COSE_KEY_Y] as Uint8Array;

    result.crv = crv;
    result.crvName = COSE_CRV_NAMES[crv] || `Unknown (${crv})`;

    if (x) {
      result.x = arrayBufferToBase64Url(new Uint8Array(x).buffer);
    }
    if (y) {
      result.y = arrayBufferToBase64Url(new Uint8Array(y).buffer);
    }
  }

  // Handle OKP keys (EdDSA)
  if (kty === 1) {
    const crv = decoded[COSE_KEY_CRV] as number;
    const x = decoded[COSE_KEY_X] as Uint8Array;

    result.crv = crv;
    result.crvName = COSE_CRV_NAMES[crv] || `Unknown (${crv})`;

    if (x) {
      result.x = arrayBufferToBase64Url(new Uint8Array(x).buffer);
    }
  }

  // Handle RSA keys
  if (kty === 3) {
    const n = decoded[COSE_KEY_CRV] as Uint8Array; // -1 for modulus
    const e = decoded[COSE_KEY_X] as Uint8Array; // -2 for exponent

    if (n) {
      result.n = arrayBufferToBase64Url(new Uint8Array(n).buffer);
    }
    if (e) {
      result.e = arrayBufferToBase64Url(new Uint8Array(e).buffer);
    }
  }

  return result;
}

/**
 * Gets the byte length of a CBOR-encoded COSE key.
 * This is needed to know where the key ends in authData.
 */
export function getCoseKeyLength(buffer: ArrayBuffer): number {
  // cbor-x doesn't provide byte length directly, so we need to re-encode
  // For now, we'll use a simple heuristic based on the structure
  const bytes = new Uint8Array(buffer);

  // Parse the CBOR manually to find the length
  let offset = 0;

  // First byte tells us the type and potentially the length
  const firstByte = bytes[offset];
  const majorType = firstByte >> 5;
  const additionalInfo = firstByte & 0x1f;

  if (majorType !== 5) {
    // Not a map, something is wrong
    throw new Error('Expected CBOR map for COSE key');
  }

  // Get the number of items in the map
  let mapLength: number;
  offset += 1;

  if (additionalInfo < 24) {
    mapLength = additionalInfo;
  } else if (additionalInfo === 24) {
    mapLength = bytes[offset];
    offset += 1;
  } else {
    // Larger maps, shouldn't happen for COSE keys
    throw new Error('Unexpected map size in COSE key');
  }

  // Skip through all key-value pairs
  for (let i = 0; i < mapLength; i++) {
    // Skip key
    offset += getCborItemLength(bytes, offset);
    // Skip value
    offset += getCborItemLength(bytes, offset);
  }

  return offset;
}

/**
 * Gets the length of a single CBOR item.
 */
function getCborItemLength(bytes: Uint8Array, offset: number): number {
  const firstByte = bytes[offset];
  const majorType = firstByte >> 5;
  const additionalInfo = firstByte & 0x1f;

  let length = 1;
  let contentLength = 0;

  // Determine the length of the length field and content
  if (additionalInfo < 24) {
    contentLength = additionalInfo;
  } else if (additionalInfo === 24) {
    contentLength = bytes[offset + 1];
    length += 1;
  } else if (additionalInfo === 25) {
    contentLength = (bytes[offset + 1] << 8) | bytes[offset + 2];
    length += 2;
  } else if (additionalInfo === 26) {
    contentLength =
      (bytes[offset + 1] << 24) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 8) |
      bytes[offset + 4];
    length += 4;
  }

  // For byte strings and text strings, add the content length
  if (majorType === 2 || majorType === 3) {
    length += contentLength;
  }

  // For negative integers, the value is encoded in the additional info
  // No additional bytes needed beyond what's already counted

  return length;
}
