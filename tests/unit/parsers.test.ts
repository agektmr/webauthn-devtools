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
  SAMPLE_AUTH_DATA_MINIMAL,
  SAMPLE_AUTH_DATA_WITH_CREDENTIAL,
  SAMPLE_CLIENT_DATA_JSON_CREATE,
  SAMPLE_CLIENT_DATA_JSON_GET,
  SAMPLE_ATTESTATION_OBJECT,
  SAMPLE_COSE_KEY_ES256,
  EXPECTED,
} from '../fixtures/webauthn-vectors';
import { parseAuthData } from '../../src/parsers/auth-data';
import { parseClientData } from '../../src/parsers/client-data';
import { parseCoseKey } from '../../src/parsers/cose-key';
import { parseAttestationObject } from '../../src/parsers/cbor';

describe('parseAuthData', () => {
  describe('minimal authData (37 bytes)', () => {
    it('should parse rpIdHash', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_MINIMAL.buffer);
      expect(result.rpIdHash).toBe(EXPECTED.rpIdHash);
    });

    it('should parse flags correctly', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_MINIMAL.buffer);
      expect(result.flags.UP).toBe(EXPECTED.flags.minimal.UP);
      expect(result.flags.UV).toBe(EXPECTED.flags.minimal.UV);
      expect(result.flags.BE).toBe(EXPECTED.flags.minimal.BE);
      expect(result.flags.BS).toBe(EXPECTED.flags.minimal.BS);
      expect(result.flags.AT).toBe(EXPECTED.flags.minimal.AT);
      expect(result.flags.ED).toBe(EXPECTED.flags.minimal.ED);
      expect(result.flags.raw).toBe(EXPECTED.flags.minimal.raw);
    });

    it('should parse signCount', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_MINIMAL.buffer);
      expect(result.signCount).toBe(EXPECTED.signCount.minimal);
    });

    it('should not have attestedCredentialData when AT flag is false', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_MINIMAL.buffer);
      expect(result.attestedCredentialData).toBeUndefined();
    });
  });

  describe('authData with attested credential', () => {
    it('should parse flags with AT flag set', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_WITH_CREDENTIAL.buffer);
      expect(result.flags.AT).toBe(true);
      expect(result.flags.UP).toBe(true);
      expect(result.flags.UV).toBe(true);
    });

    it('should parse aaguid', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_WITH_CREDENTIAL.buffer);
      expect(result.attestedCredentialData).toBeDefined();
      expect(result.attestedCredentialData!.aaguid).toBe(EXPECTED.aaguid);
    });

    it('should parse credentialId', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_WITH_CREDENTIAL.buffer);
      expect(result.attestedCredentialData).toBeDefined();
      expect(result.attestedCredentialData!.credentialId).toBe(
        EXPECTED.credentialId
      );
    });

    it('should parse COSE public key', () => {
      const result = parseAuthData(SAMPLE_AUTH_DATA_WITH_CREDENTIAL.buffer);
      expect(result.attestedCredentialData).toBeDefined();
      const publicKey = result.attestedCredentialData!.publicKey;
      expect(publicKey.kty).toBe(2);
      expect(publicKey.alg).toBe(-7);
    });
  });

  describe('flag parsing edge cases', () => {
    it('should parse all zeros flags', () => {
      // Create authData with flags = 0
      const data = new Uint8Array(SAMPLE_AUTH_DATA_MINIMAL);
      data[32] = 0x00;
      const result = parseAuthData(data.buffer);
      expect(result.flags.UP).toBe(false);
      expect(result.flags.UV).toBe(false);
      expect(result.flags.BE).toBe(false);
      expect(result.flags.BS).toBe(false);
      expect(result.flags.AT).toBe(false);
      expect(result.flags.ED).toBe(false);
    });

    it('should parse all flags set (except AT for minimal)', () => {
      // Create authData with flags = 0x1F (UP + UV + BE + BS but no AT/ED)
      const data = new Uint8Array(SAMPLE_AUTH_DATA_MINIMAL);
      data[32] = 0x1f;
      const result = parseAuthData(data.buffer);
      expect(result.flags.UP).toBe(true);
      expect(result.flags.UV).toBe(true);
      expect(result.flags.BE).toBe(true);
      expect(result.flags.BS).toBe(true);
      expect(result.flags.AT).toBe(false);
      expect(result.flags.ED).toBe(false);
    });
  });
});

describe('parseClientData', () => {
  describe('create ceremony', () => {
    it('should parse type', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_CREATE);
      expect(result.type).toBe(EXPECTED.clientData.create.type);
    });

    it('should parse challenge', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_CREATE);
      expect(result.challenge).toBe(EXPECTED.clientData.create.challenge);
    });

    it('should parse origin', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_CREATE);
      expect(result.origin).toBe(EXPECTED.clientData.create.origin);
    });

    it('should parse crossOrigin', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_CREATE);
      expect(result.crossOrigin).toBe(EXPECTED.clientData.create.crossOrigin);
    });
  });

  describe('get ceremony', () => {
    it('should parse type', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_GET);
      expect(result.type).toBe(EXPECTED.clientData.get.type);
    });

    it('should parse challenge', () => {
      const result = parseClientData(SAMPLE_CLIENT_DATA_JSON_GET);
      expect(result.challenge).toBe(EXPECTED.clientData.get.challenge);
    });
  });
});

describe('parseCoseKey', () => {
  describe('ES256 key', () => {
    it('should parse key type', () => {
      const result = parseCoseKey(SAMPLE_COSE_KEY_ES256.buffer);
      expect(result.kty).toBe(EXPECTED.coseKey.es256.kty);
      expect(result.ktyName).toBe(EXPECTED.coseKey.es256.ktyName);
    });

    it('should parse algorithm', () => {
      const result = parseCoseKey(SAMPLE_COSE_KEY_ES256.buffer);
      expect(result.alg).toBe(EXPECTED.coseKey.es256.alg);
      expect(result.algName).toBe(EXPECTED.coseKey.es256.algName);
    });

    it('should parse curve', () => {
      const result = parseCoseKey(SAMPLE_COSE_KEY_ES256.buffer);
      expect(result.crv).toBe(EXPECTED.coseKey.es256.crv);
      expect(result.crvName).toBe(EXPECTED.coseKey.es256.crvName);
    });

    it('should parse x and y coordinates', () => {
      const result = parseCoseKey(SAMPLE_COSE_KEY_ES256.buffer);
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      // x and y should be base64url encoded 32-byte values
      expect(result.x!.length).toBeGreaterThan(0);
      expect(result.y!.length).toBeGreaterThan(0);
    });
  });
});

describe('parseAttestationObject', () => {
  it('should parse fmt', () => {
    const result = parseAttestationObject(SAMPLE_ATTESTATION_OBJECT.buffer);
    expect(result.fmt).toBe(EXPECTED.attestation.fmt);
  });

  it('should parse attStmt', () => {
    const result = parseAttestationObject(SAMPLE_ATTESTATION_OBJECT.buffer);
    expect(result.attStmt).toEqual(EXPECTED.attestation.attStmt);
  });

  it('should parse authData', () => {
    const result = parseAttestationObject(SAMPLE_ATTESTATION_OBJECT.buffer);
    expect(result.authData).toBeDefined();
    expect(result.authData.rpIdHash).toBe(EXPECTED.rpIdHash);
  });
});
