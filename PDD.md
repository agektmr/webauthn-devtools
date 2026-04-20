# WebAuthn DevTools Extension - Product Design Document

## Overview

This document describes the technical design for the WebAuthn DevTools Extension, a browser extension that captures and displays WebAuthn API interactions.

## System Architecture

### High-Level Architecture

The extension only activates monitoring when the DevTools panel is open. This minimizes overhead on pages where debugging is not needed.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DevTools Panel                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  Call List        │  │  Detail View     │  │  Toolbar             │   │
│  │  Component        │  │  Component       │  │  (Export/Clear/etc)  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ PANEL_OPENED
┌─────────────────────────────────────▼───────────────────────────────────┐
│                        Service Worker (Background)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  Connection       │  │  State Store     │  │  CDP Client          │   │
│  │  Manager          │  │  (per tab)       │  │  (Virtual Auth)      │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ ACTIVATE_TAB
┌─────────────────────────────────────▼───────────────────────────────────┐
│                          Content Script                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Waits for activation, then injects script                      │    │
│  │  Message Relay: window ←→ chrome.runtime                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ Injects when activated
┌─────────────────────────────────────▼───────────────────────────────────┐
│                              Web Page                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Injected Script                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │  │
│  │  │ credentials.    │  │ credentials.    │  │ PublicKeyCredential│  │  │
│  │  │ create() wrapper│  │ get() wrapper   │  │ static methods     │  │  │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────┬────────┘   │  │
│  │           │                    │                      │            │  │
│  │           └────────────────────┴──────────────────────┘            │  │
│  │                                │                                   │  │
│  │                     window.postMessage()                           │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      ▲ WebAuthn events relayed back up
```

**Note:** If DevTools is opened after WebAuthn calls have occurred, those calls will be missed. The user must reload the page to capture subsequent calls.

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| Injected Script | Wrap WebAuthn APIs, capture calls, serialize data |
| Content Script | Wait for activation, inject script when activated, relay messages |
| Service Worker | Manage state per tab, route messages, activate content scripts, CDP integration |
| DevTools Panel | Render UI, handle user interactions, trigger activation on open |

## Project Structure

```
webauthn-devtools/
├── src/
│   ├── injected/
│   │   ├── index.ts              # Entry point, API wrappers
│   │   ├── serializer.ts         # ArrayBuffer → base64url conversion
│   │   └── interceptors/
│   │       ├── create.ts         # credentials.create() interceptor
│   │       ├── get.ts            # credentials.get() interceptor
│   │       └── static-methods.ts # PublicKeyCredential static methods
│   │
│   ├── content/
│   │   └── index.ts              # Content script, message relay
│   │
│   ├── background/
│   │   ├── index.ts              # Service worker entry
│   │   ├── state.ts              # Per-tab state management
│   │   ├── connections.ts        # DevTools panel connections
│   │   └── cdp.ts                # Chrome DevTools Protocol client
│   │
│   ├── devtools/
│   │   ├── index.html            # DevTools page (creates panel)
│   │   ├── index.ts              # Panel initialization
│   │   └── panel/
│   │       ├── index.html        # Panel HTML entry
│   │       ├── index.tsx         # React entry
│   │       ├── index.css         # Styles
│   │       ├── App.tsx           # Main panel component
│   │       ├── components/
│   │       │   ├── CallList.tsx      # List of captured calls
│   │       │   ├── CallDetail.tsx    # Request/Response detail view
│   │       │   ├── FlagsDisplay.tsx  # Vertical flags display
│   │       │   ├── JsonView.tsx      # Collapsible JSON tree
│   │       │   ├── Toolbar.tsx       # Header toolbar
│   │       │   └── FilterBar.tsx     # Search and filter
│   │       ├── hooks/
│   │       │   ├── useWebAuthnCalls.ts
│   │       │   └── useVirtualAuthStatus.ts
│   │       └── utils/
│   │           ├── formatters.ts
│   │           └── export.ts
│   │
│   ├── shared/
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── messages.ts           # Message type definitions
│   │   ├── constants.ts          # COSE algorithms, etc.
│   │   └── cbor.ts               # CBOR parsing utilities
│   │
│   └── parsers/
│       ├── attestation-object.ts # attestationObject parser
│       ├── auth-data.ts          # authData binary parser
│       ├── client-data.ts        # clientDataJSON parser
│       └── cose-key.ts           # COSE public key parser
│
├── public/
│   ├── manifest.json
│   └── icons/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Data Models

### TypeScript Interfaces

```typescript
// src/shared/types.ts

// ============================================================================
// Core Types
// ============================================================================

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
  id: string;                    // UUID
  type: CallType;
  status: CallStatus;
  timestamp: number;             // Date.now() at call initiation
  duration?: number;             // ms, set on completion
  request: CreateRequest | GetRequest | StaticMethodRequest;
  response?: CreateResponse | GetResponse | StaticMethodResponse;
  error?: ErrorInfo;
  virtualAuthenticatorId?: string;  // If handled by virtual authenticator
}

// ============================================================================
// Request Types
// ============================================================================

export interface CreateRequest {
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string;           // base64url
    name: string;
    displayName: string;
  };
  challenge: string;      // base64url
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
    algName?: string;     // Human-readable, e.g., "ES256"
  }>;
  timeout?: number;
  excludeCredentials?: CredentialDescriptor[];
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;  // Deprecated but still used
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  extensions?: Record<string, unknown>;
}

export interface GetRequest {
  rpId?: string;
  challenge: string;      // base64url
  timeout?: number;
  allowCredentials?: CredentialDescriptor[];
  userVerification?: 'required' | 'preferred' | 'discouraged';
  extensions?: Record<string, unknown>;
  mediation?: 'conditional' | 'optional' | 'required' | 'silent';
}

export interface CredentialDescriptor {
  type: 'public-key';
  id: string;             // base64url
  transports?: Array<'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid'>;
}

export interface StaticMethodRequest {
  method: string;
  args?: unknown[];
}

// ============================================================================
// Response Types
// ============================================================================

export interface CreateResponse {
  id: string;             // base64url
  rawId: string;          // base64url
  type: 'public-key';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  response: {
    clientDataJSON: string;           // base64url
    attestationObject: string;        // base64url
    transports?: string[];
  };
  clientExtensionResults: Record<string, unknown>;
  // Parsed fields (added by extension)
  parsed?: {
    clientData: ParsedClientData;
    attestation: ParsedAttestationObject;
  };
}

export interface GetResponse {
  id: string;             // base64url
  rawId: string;          // base64url
  type: 'public-key';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  response: {
    clientDataJSON: string;           // base64url
    authenticatorData: string;        // base64url
    signature: string;                // base64url
    userHandle?: string;              // base64url
  };
  clientExtensionResults: Record<string, unknown>;
  // Parsed fields (added by extension)
  parsed?: {
    clientData: ParsedClientData;
    authData: ParsedAuthData;
  };
}

export interface StaticMethodResponse {
  method: string;
  result: unknown;
}

// ============================================================================
// Parsed Data Types
// ============================================================================

export interface ParsedClientData {
  type: 'webauthn.create' | 'webauthn.get';
  challenge: string;      // base64url
  origin: string;
  topOrigin?: string;
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
  rpIdHash: string;       // hex
  flags: AuthDataFlags;
  signCount: number;
  attestedCredentialData?: {
    aaguid: string;       // UUID format
    credentialId: string; // base64url
    publicKey: ParsedCoseKey;
  };
  extensions?: Record<string, unknown>;
}

export interface AuthDataFlags {
  UP: boolean;  // User Present
  UV: boolean;  // User Verified
  BE: boolean;  // Backup Eligibility
  BS: boolean;  // Backup State
  AT: boolean;  // Attested Credential Data
  ED: boolean;  // Extension Data
  raw: number;  // Original byte value
}

export interface ParsedCoseKey {
  kty: number;            // Key type (1=OKP, 2=EC2, 3=RSA)
  ktyName: string;        // "OKP", "EC2", "RSA"
  alg: number;            // Algorithm
  algName: string;        // "ES256", "RS256", etc.
  crv?: number;           // Curve (for EC2/OKP)
  crvName?: string;       // "P-256", "Ed25519", etc.
  x?: string;             // base64url
  y?: string;             // base64url (EC2 only)
  n?: string;             // base64url (RSA modulus)
  e?: string;             // base64url (RSA exponent)
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorInfo {
  name: string;           // e.g., "NotAllowedError"
  message: string;
  stack?: string;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportData {
  version: '1.0';
  exportedAt: string;     // ISO 8601
  origin: string;
  userAgent: string;
  calls: WebAuthnCall[];
}
```

### Message Protocol

```typescript
// src/shared/messages.ts

// ============================================================================
// Injected Script → Content Script (via window.postMessage)
// ============================================================================

export interface InjectedMessage {
  source: 'webauthn-devtools-injected';
  payload: InjectedPayload;
}

export type InjectedPayload =
  | { type: 'CALL_START'; data: { id: string; callType: CallType; request: unknown } }
  | { type: 'CALL_SUCCESS'; data: { id: string; response: unknown } }
  | { type: 'CALL_ERROR'; data: { id: string; error: ErrorInfo } }
  | { type: 'CALL_ABORT'; data: { id: string } };

// ============================================================================
// Content Script ↔ Service Worker (via chrome.runtime)
// ============================================================================

export interface RuntimeMessage {
  source: 'webauthn-devtools';
  tabId?: number;  // Added by service worker for routing
  payload: RuntimePayload;
}

export type RuntimePayload =
  // From content script
  | { type: 'CONTENT_READY' }  // Content script ready for activation
  | { type: 'WEBAUTHN_EVENT'; data: InjectedPayload['type'] extends infer T ? T : never }
  // From DevTools panel
  | { type: 'PANEL_OPENED'; tabId: number }
  | { type: 'PANEL_CLOSED'; tabId: number }
  | { type: 'CLEAR_CALLS'; tabId: number }
  | { type: 'GET_CALLS'; tabId: number }
  | { type: 'GET_VIRTUAL_AUTH_STATUS'; tabId: number }
  // From service worker to panel
  | { type: 'CALLS_UPDATE'; calls: WebAuthnCall[] }
  | { type: 'VIRTUAL_AUTH_STATUS'; enabled: boolean; authenticators: VirtualAuthenticator[] }
  // From service worker to content script
  | { type: 'ACTIVATE_TAB' };  // Signal to inject interceptors

// ============================================================================
// Virtual Authenticator Types
// ============================================================================

export interface VirtualAuthenticator {
  authenticatorId: string;
  protocol: 'ctap2' | 'u2f';
  transport: 'usb' | 'nfc' | 'ble' | 'internal';
  hasResidentKey: boolean;
  hasUserVerification: boolean;
  isUserVerified: boolean;
}
```

## Component Design

### 1. Injected Script

The injected script runs in the page context to intercept WebAuthn API calls.

```typescript
// src/injected/index.ts

const ORIGINAL_CREATE = navigator.credentials.create.bind(navigator.credentials);
const ORIGINAL_GET = navigator.credentials.get.bind(navigator.credentials);

function generateId(): string {
  return crypto.randomUUID();
}

function postMessage(payload: InjectedPayload): void {
  window.postMessage({
    source: 'webauthn-devtools-injected',
    payload
  }, '*');
}

// Wrap navigator.credentials.create
navigator.credentials.create = async function(
  options?: CredentialCreationOptions
): Promise<Credential | null> {
  // Only intercept WebAuthn (publicKey) requests
  if (!options?.publicKey) {
    return ORIGINAL_CREATE(options);
  }

  const id = generateId();
  const serializedRequest = serializeCreateRequest(options.publicKey);

  postMessage({
    type: 'CALL_START',
    data: { id, callType: 'create', request: serializedRequest }
  });

  try {
    const credential = await ORIGINAL_CREATE(options);

    if (credential) {
      const serializedResponse = serializeCreateResponse(
        credential as PublicKeyCredential
      );
      postMessage({
        type: 'CALL_SUCCESS',
        data: { id, response: serializedResponse }
      });
    }

    return credential;
  } catch (error) {
    postMessage({
      type: 'CALL_ERROR',
      data: { id, error: serializeError(error) }
    });
    throw error;
  }
};

// Similar implementation for navigator.credentials.get
// and PublicKeyCredential static methods
```

### 2. Serialization

ArrayBuffers must be converted to base64url for message passing.

```typescript
// src/injected/serializer.ts

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function serializeCreateRequest(
  options: PublicKeyCredentialCreationOptions
): CreateRequest {
  return {
    rp: {
      id: options.rp.id,
      name: options.rp.name
    },
    user: {
      id: arrayBufferToBase64Url(options.user.id as ArrayBuffer),
      name: options.user.name,
      displayName: options.user.displayName
    },
    challenge: arrayBufferToBase64Url(options.challenge as ArrayBuffer),
    pubKeyCredParams: options.pubKeyCredParams.map(param => ({
      type: param.type,
      alg: param.alg,
      algName: COSE_ALG_NAMES[param.alg] || `Unknown (${param.alg})`
    })),
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map(cred => ({
      type: cred.type,
      id: arrayBufferToBase64Url(cred.id as ArrayBuffer),
      transports: cred.transports
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
    extensions: options.extensions
  };
}
```

### 3. AuthData Parser

Binary parser for authenticator data structure.

```typescript
// src/parsers/auth-data.ts

export function parseAuthData(authDataBuffer: ArrayBuffer): ParsedAuthData {
  const data = new DataView(authDataBuffer);
  const bytes = new Uint8Array(authDataBuffer);
  let offset = 0;

  // rpIdHash (32 bytes)
  const rpIdHash = bytesToHex(bytes.slice(offset, offset + 32));
  offset += 32;

  // flags (1 byte)
  const flagsByte = data.getUint8(offset);
  const flags: AuthDataFlags = {
    UP: Boolean(flagsByte & 0x01),
    UV: Boolean(flagsByte & 0x04),
    BE: Boolean(flagsByte & 0x08),
    BS: Boolean(flagsByte & 0x10),
    AT: Boolean(flagsByte & 0x40),
    ED: Boolean(flagsByte & 0x80),
    raw: flagsByte
  };
  offset += 1;

  // signCount (4 bytes, big-endian)
  const signCount = data.getUint32(offset, false);
  offset += 4;

  const result: ParsedAuthData = {
    rpIdHash,
    flags,
    signCount
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
    const credentialId = arrayBufferToBase64Url(
      bytes.slice(offset, offset + credentialIdLength).buffer
    );
    offset += credentialIdLength;

    // credentialPublicKey (CBOR, remaining bytes before extensions)
    const remainingBytes = bytes.slice(offset);
    const { value: publicKey, bytesRead } = decodeCoseKey(remainingBytes);
    offset += bytesRead;

    result.attestedCredentialData = {
      aaguid,
      credentialId,
      publicKey
    };
  }

  // extensions (CBOR, if ED flag is set)
  if (flags.ED) {
    const extensionsBytes = bytes.slice(offset);
    result.extensions = decodeCbor(extensionsBytes);
  }

  return result;
}

function formatUUID(bytes: Uint8Array): string {
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 4. Service Worker State Management

```typescript
// src/background/state.ts

interface TabState {
  calls: WebAuthnCall[];
  virtualAuthEnabled: boolean;
  virtualAuthenticators: VirtualAuthenticator[];
}

class StateManager {
  private state = new Map<number, TabState>();

  getState(tabId: number): TabState {
    if (!this.state.has(tabId)) {
      this.state.set(tabId, {
        calls: [],
        virtualAuthEnabled: false,
        virtualAuthenticators: []
      });
    }
    return this.state.get(tabId)!;
  }

  addCall(tabId: number, call: WebAuthnCall): void {
    const state = this.getState(tabId);
    state.calls.push(call);
    this.notifyPanel(tabId);
  }

  updateCall(tabId: number, id: string, update: Partial<WebAuthnCall>): void {
    const state = this.getState(tabId);
    const call = state.calls.find(c => c.id === id);
    if (call) {
      Object.assign(call, update);
      this.notifyPanel(tabId);
    }
  }

  clearCalls(tabId: number): void {
    const state = this.getState(tabId);
    state.calls = [];
    this.notifyPanel(tabId);
  }

  deleteTab(tabId: number): void {
    this.state.delete(tabId);
  }

  private notifyPanel(tabId: number): void {
    const state = this.getState(tabId);
    connectionManager.sendToPanel(tabId, {
      type: 'CALLS_UPDATE',
      calls: state.calls
    });
  }
}

export const stateManager = new StateManager();
```

**Data Persistence:**
- Calls are preserved across page navigations (not cleared on navigation or refresh)
- State is only cleared when:
  - User clicks the Clear button in the panel
  - The tab is closed
- This allows developers to track WebAuthn calls across multiple pages in a flow

**Panel Connection (Race Condition Prevention):**
```typescript
// src/devtools/panel/hooks/useWebAuthnCalls.ts
useEffect(() => {
  const port = chrome.runtime.connect({ name: 'webauthn-devtools-panel' });

  // CRITICAL: Set up listener BEFORE sending PANEL_OPENED
  port.onMessage.addListener(handleMessage);

  // Now notify background - it will respond with current state
  port.postMessage({ type: 'PANEL_OPENED', tabId });

  return () => { port.disconnect(); };
}, []);
```

### 5. CDP Integration for Virtual Authenticator

```typescript
// src/background/cdp.ts

class CDPClient {
  private targets = new Map<number, chrome.debugger.Debuggee>();

  async attach(tabId: number): Promise<void> {
    const debuggee: chrome.debugger.Debuggee = { tabId };
    await chrome.debugger.attach(debuggee, '1.3');
    this.targets.set(tabId, debuggee);

    // Listen for WebAuthn events
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (source.tabId !== tabId) return;
      this.handleEvent(tabId, method, params);
    });
  }

  async checkVirtualAuthStatus(tabId: number): Promise<{
    enabled: boolean;
    authenticators: VirtualAuthenticator[];
  }> {
    try {
      const debuggee = this.targets.get(tabId);
      if (!debuggee) {
        return { enabled: false, authenticators: [] };
      }

      // Check if WebAuthn domain is enabled
      const result = await chrome.debugger.sendCommand(
        debuggee,
        'WebAuthn.getAuthenticators',
        {}
      ) as { authenticators: VirtualAuthenticator[] };

      return {
        enabled: true,
        authenticators: result.authenticators || []
      };
    } catch {
      return { enabled: false, authenticators: [] };
    }
  }

  private handleEvent(tabId: number, method: string, params: unknown): void {
    switch (method) {
      case 'WebAuthn.credentialAdded':
        // Handle credential added to virtual authenticator
        break;
      case 'WebAuthn.credentialAsserted':
        // Handle credential assertion on virtual authenticator
        break;
    }
  }

  detach(tabId: number): void {
    const debuggee = this.targets.get(tabId);
    if (debuggee) {
      chrome.debugger.detach(debuggee);
      this.targets.delete(tabId);
    }
  }
}

export const cdpClient = new CDPClient();
```

### 6. DevTools Panel Components

```tsx
// src/devtools/panel/App.tsx

import { useState, useEffect } from 'react';
import { CallList } from './components/CallList';
import { CallDetail } from './components/CallDetail';
import { Toolbar } from './components/Toolbar';
import { FilterBar } from './components/FilterBar';
import { useWebAuthnCalls } from './hooks/useWebAuthnCalls';
import { useVirtualAuthStatus } from './hooks/useVirtualAuthStatus';
import type { WebAuthnCall, CallType } from '../../shared/types';

export function App() {
  const { calls, clearCalls } = useWebAuthnCalls();
  const { isVirtualAuthEnabled } = useVirtualAuthStatus();
  const [selectedCall, setSelectedCall] = useState<WebAuthnCall | null>(null);
  const [filter, setFilter] = useState<{
    search: string;
    type: CallType | 'all';
  }>({ search: '', type: 'all' });

  const filteredCalls = calls.filter(call => {
    if (filter.type !== 'all' && call.type !== filter.type) {
      return false;
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      // Search in relevant fields
      return (
        call.type.toLowerCase().includes(searchLower) ||
        JSON.stringify(call.request).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="panel">
      <Toolbar
        isVirtualAuthEnabled={isVirtualAuthEnabled}
        onExport={() => exportCalls(calls)}
        onClear={clearCalls}
      />
      <FilterBar filter={filter} onFilterChange={setFilter} />
      <div className="panel-content">
        <CallList
          calls={filteredCalls}
          selectedId={selectedCall?.id}
          onSelect={setSelectedCall}
        />
        <CallDetail call={selectedCall} />
      </div>
    </div>
  );
}
```

```tsx
// src/devtools/panel/components/FlagsDisplay.tsx

import type { AuthDataFlags } from '../../../shared/types';
import { formatFlagName } from '../utils/formatters';

interface FlagsDisplayProps {
  flags: AuthDataFlags;
}

const FLAG_ORDER: (keyof Omit<AuthDataFlags, 'raw'>)[] = [
  'UP', 'UV', 'BE', 'BS', 'AT', 'ED',
];

export function FlagsDisplay({ flags }: FlagsDisplayProps) {
  return (
    <div className="flags-display vertical">
      {FLAG_ORDER.map((flag) => (
        <div key={flag} className={`flag-item ${flags[flag] ? 'true' : 'false'}`}>
          <span className="flag-icon">
            {flags[flag] ? '\u2713' : '\u25CB'}
          </span>
          <span className="flag-label">{flag}</span>
          <span className="flag-name">({formatFlagName(flag)})</span>
        </div>
      ))}
    </div>
  );
}
```

**FlagsDisplay features:**
- Vertical layout with icons (✓ for true, ○ for false)
- True flags highlighted in green, false flags dimmed
- Each flag shows abbreviation and full name

### CallDetail Component Structure

The CallDetail component uses two tabs (Request and Response) with parsed data displayed inline:

```tsx
// src/devtools/panel/components/CallDetail.tsx

// Main component with Request/Response tabs (no Parsed tab)
export function CallDetail({ call }: CallDetailProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  // ...
}

// Response view with inline parsed data
function CreateResponseView({ response }: { response: CreateResponse }) {
  // Parses clientDataJSON and attestationObject
  // Displays raw fields with inline ParsedBlock components
}

function GetResponseView({ response }: { response: GetResponse }) {
  // Parses clientDataJSON and authenticatorData
  // Displays raw fields with inline ParsedBlock components
}

// Helper components
function JsonProperty({ name, value, isObject }: JsonPropertyProps) {
  // Renders a single JSON property
}

function ParsedBlock({ title, children }: ParsedBlockProps) {
  // Renders a collapsible parsed data block
}
```

**CallDetail features:**
- Two tabs only: Request and Response
- Parsed clientData shown inline after clientDataJSON field
- Parsed attestation/authData shown inline after attestationObject/authenticatorData field
- Flags displayed vertically within parsed authData section

## Manifest Configuration

```json
// public/manifest.json (Manifest V3)

{
  "manifest_version": 3,
  "name": "WebAuthn DevTools",
  "version": "1.0.0",
  "description": "Capture and inspect WebAuthn API calls",

  "permissions": [
    "debugger"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start",
      "all_frames": true
    }
  ],

  "devtools_page": "devtools.html",

  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["<all_urls>"]
    }
  ],

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Build Configuration

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        injected: resolve(__dirname, 'src/injected/index.ts'),
        devtools: resolve(__dirname, 'src/devtools/index.html'),
        panel: resolve(__dirname, 'src/devtools/panel/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

## Cross-Browser Compatibility

### Browser API Differences

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| Manifest | V3 | V3 (with differences) | V2/V3 hybrid |
| Service Worker | Yes | Yes | Limited |
| CDP Access | Full | N/A | N/A |
| debugger API | Yes | Limited | No |

### Compatibility Strategy

1. **Core functionality** (API interception, display): Works on all browsers
2. **Virtual authenticator integration**: Chrome/Edge only (CDP required)
3. **Use feature detection** for optional capabilities:

```typescript
// src/shared/capabilities.ts

export const capabilities = {
  hasDebuggerAPI: typeof chrome?.debugger !== 'undefined',
  hasCDP: typeof chrome?.debugger?.sendCommand !== 'undefined',

  get supportsVirtualAuth(): boolean {
    return this.hasCDP;
  }
};
```

## Testing Strategy

### Unit Tests

- Serialization functions (ArrayBuffer ↔ base64url)
- AuthData parser with known test vectors
- CBOR decoding
- State management

### Integration Tests

- Message passing between components
- API interception verification
- DevTools panel rendering

### Test Vectors

Use WebAuthn test vectors from the W3C specification and FIDO Alliance for parsing tests.

## Dependencies

```json
{
  "dependencies": {
    "cbor-x": "^1.5.0"
  },
  "devDependencies": {
    "@anthropic-ai/claude-code": "^1.0.0",
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0"
  }
}
```

## Security Considerations

1. **No external data transmission**: All data stays in browser memory
2. **Content Security Policy**: Strict CSP for DevTools panel
3. **Input sanitization**: Sanitize displayed data to prevent XSS
4. **Minimal permissions**: Only request necessary permissions
