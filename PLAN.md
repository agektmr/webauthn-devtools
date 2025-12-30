# WebAuthn DevTools Extension - Implementation Plan

## Current State

**Completed (~15%):**
- `package.json` - Dependencies configured (cbor-x, React, Vite, TypeScript)
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Multi-entry build (background, content, injected, devtools, panel)
- `public/manifest.json` - Manifest V3 configuration
- `src/shared/types.ts` - All TypeScript interfaces
- `src/shared/constants.ts` - COSE algorithms, error mappings
- `src/shared/messages.ts` - Message protocol with type guards

**Empty directories:** `src/injected/`, `src/content/`, `src/background/`, `src/devtools/`, `src/parsers/`

---

## Implementation Phases

### Phase 1: Data Capture Pipeline (Core)

Build the message flow: Injected → Content → Background

#### 1.1 Parsers (`src/parsers/`)
| File | Purpose |
|------|---------|
| `cbor.ts` | Wrap cbor-x library for attestationObject decoding |
| `auth-data.ts` | Parse authData binary (rpIdHash, flags, signCount, attestedCredentialData) |
| `client-data.ts` | Decode and parse clientDataJSON |
| `cose-key.ts` | Parse COSE public key structure |
| `index.ts` | Re-export all parsers |

#### 1.2 Injected Script (`src/injected/`)
| File | Purpose |
|------|---------|
| `serializer.ts` | `arrayBufferToBase64Url()`, `base64UrlToArrayBuffer()`, request/response serializers |
| `interceptors/create.ts` | Wrap `navigator.credentials.create()` |
| `interceptors/get.ts` | Wrap `navigator.credentials.get()` |
| `interceptors/static-methods.ts` | Wrap PublicKeyCredential static methods |
| `index.ts` | Install all interceptors, post messages to window |

#### 1.3 Content Script (`src/content/`)
| File | Purpose |
|------|---------|
| `index.ts` | Listen for window messages, relay to background via `chrome.runtime.sendMessage()` |

#### 1.4 Background Service Worker (`src/background/`)
| File | Purpose |
|------|---------|
| `state.ts` | Per-tab state store (Map<tabId, WebAuthnCall[]>) |
| `connections.ts` | Manage DevTools panel port connections |
| `cdp.ts` | Chrome DevTools Protocol client for virtual authenticator |
| `index.ts` | Message router, tab lifecycle handlers |

---

### Phase 2: DevTools Panel UI

#### 2.1 DevTools Entry (`src/devtools/`)
| File | Purpose |
|------|---------|
| `index.html` | DevTools page that creates the panel |
| `index.ts` | Call `chrome.devtools.panels.create()` |

#### 2.2 Panel Application (`src/devtools/panel/`)
| File | Purpose |
|------|---------|
| `index.html` | Panel HTML with React mount point |
| `index.tsx` | React app entry, render `<App />` |
| `index.css` | Global styles (DevTools-like dark theme) |
| `App.tsx` | Main layout: Toolbar + FilterBar + CallList + CallDetail |

#### 2.3 Components (`src/devtools/panel/components/`)
| File | Purpose |
|------|---------|
| `Toolbar.tsx` | Header with virtual auth indicator, Export, Clear buttons |
| `FilterBar.tsx` | Search input + type filter dropdown |
| `CallList.tsx` | Chronological list of captured calls with status icons |
| `CallDetail.tsx` | Request/response detail view for selected call |
| `FlagsDisplay.tsx` | AuthData flags visualization (UP, UV, BE, BS, AT, ED) |
| `JsonView.tsx` | Collapsible JSON tree for complex objects |

#### 2.4 Hooks (`src/devtools/panel/hooks/`)
| File | Purpose |
|------|---------|
| `useWebAuthnCalls.ts` | Connect to background, subscribe to call updates |
| `useVirtualAuthStatus.ts` | Query virtual authenticator status via CDP |

#### 2.5 Utilities (`src/devtools/panel/utils/`)
| File | Purpose |
|------|---------|
| `formatters.ts` | Format timestamps, base64url, algorithm names |
| `export.ts` | Generate ExportData JSON, trigger download |

---

### Phase 3: Static Assets & Polish

#### 3.1 Icons (`public/icons/`)
- `icon16.png`, `icon48.png`, `icon128.png` - Simple key/lock icon

#### 3.2 CSS Styling
- DevTools-consistent dark theme
- Status indicators (green/red/yellow/gray)
- Flags grid with checkmarks/crosses

---

## Implementation Order (Test-Driven Development)

Write tests first, then implement to make tests pass.

### Step 1: Test Infrastructure
```
1. vitest.config.ts                    # Configure Vitest for the project
2. tests/setup.ts                      # Test setup (mocks for chrome APIs)
```

### Step 2: Serializer (Tests → Implementation)
```
3. tests/unit/serializer.test.ts       # Test base64url encode/decode
4. src/injected/serializer.ts          # Implement to pass tests
```

### Step 3: Parsers (Tests → Implementation)
```
5. tests/fixtures/webauthn-vectors.ts  # W3C/FIDO test vectors
6. tests/unit/parsers.test.ts          # Test all parsers
7. src/parsers/cbor.ts                 # Implement CBOR wrapper
8. src/parsers/auth-data.ts            # Implement authData parser
9. src/parsers/client-data.ts          # Implement clientData parser
10. src/parsers/cose-key.ts            # Implement COSE key parser
11. src/parsers/index.ts               # Re-export parsers
```

### Step 4: State Management (Tests → Implementation)
```
12. tests/unit/state.test.ts           # Test state operations
13. src/background/state.ts            # Implement state manager
```

### Step 5: Message Handling (Tests → Implementation)
```
14. tests/unit/messages.test.ts        # Test message validation
15. src/background/connections.ts      # Implement connection manager
16. src/background/cdp.ts              # Implement CDP client
17. src/background/index.ts            # Implement service worker
```

### Step 6: Content & Injected Scripts
```
18. src/content/index.ts               # Content script relay
19. src/injected/interceptors/create.ts
20. src/injected/interceptors/get.ts
21. src/injected/interceptors/static-methods.ts
22. src/injected/index.ts
```

### Step 7: DevTools Panel UI
```
23. src/devtools/index.html
24. src/devtools/index.ts
25. src/devtools/panel/index.html
26. src/devtools/panel/index.tsx
27. src/devtools/panel/index.css
28. src/devtools/panel/App.tsx
29. src/devtools/panel/components/Toolbar.tsx
30. src/devtools/panel/components/FilterBar.tsx
31. src/devtools/panel/components/CallList.tsx
32. src/devtools/panel/components/CallDetail.tsx
33. src/devtools/panel/components/FlagsDisplay.tsx
34. src/devtools/panel/components/JsonView.tsx
35. src/devtools/panel/hooks/useWebAuthnCalls.ts
36. src/devtools/panel/hooks/useVirtualAuthStatus.ts
37. src/devtools/panel/utils/formatters.ts
38. src/devtools/panel/utils/export.ts
```

### Step 8: Final
```
39. public/icons/* (placeholder SVGs)
40. npm run test && npm run build
```

---

## Test Files Detail

### `tests/setup.ts`
- Mock `chrome.runtime`, `chrome.devtools`, `chrome.debugger`
- Mock `window.postMessage`
- Setup jsdom environment

### `tests/fixtures/webauthn-vectors.ts`
Real WebAuthn test data:
- Sample attestationObject (CBOR encoded)
- Sample authData with all flag combinations
- Sample clientDataJSON
- Sample COSE keys (ES256, RS256, EdDSA)

### `tests/unit/serializer.test.ts`
- `arrayBufferToBase64Url()`: empty, small, large buffers
- `base64UrlToArrayBuffer()`: round-trip verification
- Edge cases: padding, special characters

### `tests/unit/parsers.test.ts`
- `parseAuthData()`: flags extraction, signCount, attestedCredentialData
- `parseClientData()`: type, challenge, origin validation
- `parseCoseKey()`: EC2, RSA, OKP key types
- `decodeCbor()`: attestationObject decoding

### `tests/unit/state.test.ts`
- `addCall()`: adds to correct tab
- `updateCall()`: updates existing call
- `clearCalls()`: clears tab state
- `deleteTab()`: removes tab state

---

## Key Implementation Details

### Injected Script Injection
Content script injects via `<script>` element at document_start:
```typescript
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
document.documentElement.appendChild(script);
script.remove();
```

### Message Flow
```
Page calls create()/get()
    ↓
Injected: serialize request → window.postMessage(CALL_START)
    ↓
Content: validate → chrome.runtime.sendMessage()
    ↓
Background: store in state → port.postMessage() to panel
    ↓
Panel: useWebAuthnCalls hook updates → React re-render
```

### AuthData Parsing (Critical)
```
Offset 0-31:  rpIdHash (32 bytes, SHA-256)
Offset 32:    flags (1 byte)
Offset 33-36: signCount (4 bytes, big-endian)
Offset 37+:   attestedCredentialData (if AT flag) + extensions (if ED flag)
```

### Flags Byte (0x__):
- Bit 0 (0x01): UP - User Present
- Bit 2 (0x04): UV - User Verified
- Bit 3 (0x08): BE - Backup Eligible
- Bit 4 (0x10): BS - Backup State
- Bit 6 (0x40): AT - Attested Credential Data
- Bit 7 (0x80): ED - Extension Data

---

## Testing Checkpoints (TDD)

1. **After Step 2**: `npm run test` - serializer tests pass
2. **After Step 3**: `npm run test` - all parser tests pass
3. **After Step 5**: `npm run test` - state + message tests pass
4. **After Step 6**: `npm run build` - extension loads in Chrome
5. **After Step 7**: Manual test on webauthn.io - full flow works
6. **Final**: All tests green, extension captures create/get, flags display correctly

---

## Dependencies

Already in package.json:
- `cbor-x` - CBOR decoding
- `react`, `react-dom` - UI
- `@types/chrome` - Extension API types

No additional dependencies needed.

---

## TODO

- [ ] Make it working on Firefox and Safari
- [ ] Explore incremental permission for different websites
