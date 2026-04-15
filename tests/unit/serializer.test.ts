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

import { describe, it, expect } from 'vitest';
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  serializeCreateRequest,
  serializeGetRequest,
} from '../../src/injected/serializer';

describe('arrayBufferToBase64Url', () => {
  it('should encode an empty buffer', () => {
    const buffer = new ArrayBuffer(0);
    expect(arrayBufferToBase64Url(buffer)).toBe('');
  });

  it('should encode a simple buffer', () => {
    // "Hello" in ASCII
    const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
    expect(arrayBufferToBase64Url(buffer)).toBe('SGVsbG8');
  });

  it('should not include padding characters', () => {
    // Single byte should not have padding
    const buffer = new Uint8Array([65]).buffer;
    const result = arrayBufferToBase64Url(buffer);
    expect(result).not.toContain('=');
    expect(result).toBe('QQ');
  });

  it('should use URL-safe characters (- instead of +, _ instead of /)', () => {
    // Bytes that would produce + and / in standard base64
    // 0xFB, 0xEF = +/
    const buffer = new Uint8Array([0xfb, 0xef]).buffer;
    const result = arrayBufferToBase64Url(buffer);
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).toBe('--8');
  });

  it('should handle binary data with null bytes', () => {
    const buffer = new Uint8Array([0, 1, 2, 0, 3]).buffer;
    const result = arrayBufferToBase64Url(buffer);
    expect(result).toBe('AAECAAM');
  });

  it('should handle large buffers', () => {
    // 1KB of random-ish data
    const data = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) {
      data[i] = i % 256;
    }
    const result = arrayBufferToBase64Url(data.buffer);
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('=');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });
});

describe('base64UrlToArrayBuffer', () => {
  it('should decode an empty string', () => {
    const buffer = base64UrlToArrayBuffer('');
    expect(buffer.byteLength).toBe(0);
  });

  it('should decode a simple string', () => {
    // "SGVsbG8" = "Hello"
    const buffer = base64UrlToArrayBuffer('SGVsbG8');
    const bytes = new Uint8Array(buffer);
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it('should handle URL-safe characters', () => {
    // "--8" contains - and should decode correctly
    const buffer = base64UrlToArrayBuffer('--8');
    const bytes = new Uint8Array(buffer);
    expect(bytes).toEqual(new Uint8Array([0xfb, 0xef]));
  });

  it('should handle strings without padding', () => {
    // "QQ" = single byte 'A' (65)
    const buffer = base64UrlToArrayBuffer('QQ');
    const bytes = new Uint8Array(buffer);
    expect(bytes).toEqual(new Uint8Array([65]));
  });

  it('should handle strings that would need 1 padding char', () => {
    // "QUI" = "AB"
    const buffer = base64UrlToArrayBuffer('QUI');
    const bytes = new Uint8Array(buffer);
    expect(bytes).toEqual(new Uint8Array([65, 66]));
  });

  it('should handle strings that would need 2 padding chars', () => {
    // "QUJD" = "ABC"
    const buffer = base64UrlToArrayBuffer('QUJD');
    const bytes = new Uint8Array(buffer);
    expect(bytes).toEqual(new Uint8Array([65, 66, 67]));
  });
});

describe('round-trip encoding/decoding', () => {
  it('should round-trip empty buffer', () => {
    const original = new ArrayBuffer(0);
    const encoded = arrayBufferToBase64Url(original);
    const decoded = base64UrlToArrayBuffer(encoded);
    expect(decoded.byteLength).toBe(0);
  });

  it('should round-trip small buffer', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = arrayBufferToBase64Url(original.buffer);
    const decoded = base64UrlToArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should round-trip buffer with all byte values', () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }
    const encoded = arrayBufferToBase64Url(original.buffer);
    const decoded = base64UrlToArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should round-trip WebAuthn-like challenge', () => {
    // Typical 32-byte challenge
    const original = new Uint8Array(32);
    crypto.getRandomValues(original);
    const encoded = arrayBufferToBase64Url(original.buffer);
    const decoded = base64UrlToArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should round-trip credential ID', () => {
    // Typical credential ID (64 bytes)
    const original = new Uint8Array(64);
    crypto.getRandomValues(original);
    const encoded = arrayBufferToBase64Url(original.buffer);
    const decoded = base64UrlToArrayBuffer(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });
});

describe('serializeCreateRequest hints', () => {
  function baseCreateOptions(): PublicKeyCredentialCreationOptions {
    return {
      rp: { id: 'example.com', name: 'Example' },
      user: {
        id: new Uint8Array([1, 2, 3]),
        name: 'alice',
        displayName: 'Alice',
      },
      challenge: new Uint8Array([4, 5, 6]),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    };
  }

  it('should include hints when provided', () => {
    const options = {
      ...baseCreateOptions(),
      hints: ['client-device', 'hybrid'],
    } as PublicKeyCredentialCreationOptions & { hints: string[] };

    const serialized = serializeCreateRequest(options);
    expect(serialized.hints).toEqual(['client-device', 'hybrid']);
  });

  it('should set hints to undefined when not provided', () => {
    const serialized = serializeCreateRequest(baseCreateOptions());
    expect(serialized.hints).toBeUndefined();
  });

  it('should not mutate the original hints array', () => {
    const hints = ['security-key'];
    const options = {
      ...baseCreateOptions(),
      hints,
    } as PublicKeyCredentialCreationOptions & { hints: string[] };

    const serialized = serializeCreateRequest(options);
    expect(serialized.hints).not.toBe(hints);
    expect(serialized.hints).toEqual(hints);
  });
});

describe('serializeGetRequest hints', () => {
  function baseGetOptions(): PublicKeyCredentialRequestOptions {
    return {
      challenge: new Uint8Array([1, 2, 3]),
    };
  }

  it('should include hints when provided', () => {
    const options = {
      ...baseGetOptions(),
      hints: ['security-key'],
    } as PublicKeyCredentialRequestOptions & { hints: string[] };

    const serialized = serializeGetRequest(options);
    expect(serialized.hints).toEqual(['security-key']);
  });

  it('should set hints to undefined when not provided', () => {
    const serialized = serializeGetRequest(baseGetOptions());
    expect(serialized.hints).toBeUndefined();
  });

  it('should pass through mediation alongside hints', () => {
    const options = {
      ...baseGetOptions(),
      hints: ['client-device'],
    } as PublicKeyCredentialRequestOptions & { hints: string[] };

    const serialized = serializeGetRequest(options, 'conditional');
    expect(serialized.hints).toEqual(['client-device']);
    expect(serialized.mediation).toBe('conditional');
  });
});
