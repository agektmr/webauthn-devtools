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
 * Core types for WebAuthn DevTools Extension
 */

export type CallType =
  | 'create'
  | 'get'
  | 'isUserVerifyingPlatformAuthenticatorAvailable'
  | 'isConditionalMediationAvailable'
  | 'getClientCapabilities'
  | 'signalUnknownCredential'
  | 'signalAllAcceptedCredentials'
  | 'signalCurrentUserDetails';

export type CallStatus = 'pending' | 'success' | 'error' | 'aborted';

export interface WebAuthnCall {
  id: string;
  type: CallType;
  status: CallStatus;
  timestamp: number;
  duration?: number;
  request: CreateRequest | GetRequest | StaticMethodRequest;
  response?: CreateResponse | GetResponse | StaticMethodResponse;
  error?: ErrorInfo;
  virtualAuthenticatorId?: string;
}

export interface CreateRequest {
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
    algName?: string;
  }>;
  timeout?: number;
  excludeCredentials?: CredentialDescriptor[];
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  extensions?: Record<string, unknown>;
}

export interface GetRequest {
  rpId?: string;
  challenge: string;
  timeout?: number;
  allowCredentials?: CredentialDescriptor[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
  extensions?: Record<string, unknown>;
  mediation?: 'conditional' | 'optional' | 'required' | 'silent';
}

export interface CredentialDescriptor {
  type: 'public-key';
  id: string;
  transports?: Array<'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid'>;
}

export interface StaticMethodRequest {
  method: string;
  args?: unknown[];
}

export interface CreateResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
  clientExtensionResults: Record<string, unknown>;
  parsed?: {
    clientData: ParsedClientData;
    attestation: ParsedAttestationObject;
  };
}

export interface GetResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  clientExtensionResults: Record<string, unknown>;
  parsed?: {
    clientData: ParsedClientData;
    authData: ParsedAuthData;
  };
}

export interface StaticMethodResponse {
  method: string;
  result: unknown;
}

export interface ParsedClientData {
  type: 'webauthn.create' | 'webauthn.get';
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
  tokenBinding?: {
    status: string;
    id?: string;
  };
}

export interface ParsedAttestationObject {
  fmt: string;
  attStmt: Record<string, unknown>;
  authData: ParsedAuthData;
}

export interface ParsedAuthData {
  rpIdHash: string;
  flags: AuthDataFlags;
  signCount: number;
  attestedCredentialData?: {
    aaguid: string;
    credentialId: string;
    publicKey: ParsedCoseKey;
  };
  extensions?: Record<string, unknown>;
}

export interface AuthDataFlags {
  UP: boolean;
  UV: boolean;
  BE: boolean;
  BS: boolean;
  AT: boolean;
  ED: boolean;
  raw: number;
}

export interface ParsedCoseKey {
  kty: number;
  ktyName: string;
  alg: number;
  algName: string;
  crv?: number;
  crvName?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
}

export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
}

export interface ExportData {
  version: '1.0';
  exportedAt: string;
  origin: string;
  userAgent: string;
  calls: WebAuthnCall[];
}

export interface VirtualAuthenticator {
  authenticatorId: string;
  protocol: 'ctap2' | 'u2f';
  transport: 'usb' | 'nfc' | 'ble' | 'internal';
  hasResidentKey: boolean;
  hasUserVerification: boolean;
  isUserVerified: boolean;
}
