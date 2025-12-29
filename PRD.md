# WebAuthn DevTools Extension - Product Requirements Document

## Overview

A browser DevTools extension that captures WebAuthn API interactions on web pages and displays them in a dedicated DevTools panel, helping web developers debug and understand their passkey/WebAuthn implementations.

## Problem Statement

Web developers implementing WebAuthn/passkeys face challenges:
- **Opaque API behavior**: WebAuthn API calls and responses are difficult to inspect with standard DevTools
- **Complex data structures**: Credential options and responses contain ArrayBuffers and nested objects that are hard to read
- **Debugging friction**: No native way to see the exact parameters passed to `navigator.credentials.create()` and `navigator.credentials.get()`
- **Error diagnosis**: When authentication fails, it's unclear whether the issue is in the request parameters or authenticator response

## Goals

### Primary Goals
- Provide visibility into all WebAuthn API interactions on a page
- Display request parameters and responses in a human-readable format
- Help developers quickly identify configuration issues

### Non-Goals (MVP)
- Mocking authenticator responses
- Modifying or intercepting requests
- Security auditing and recommendations
- Automated testing capabilities

## Target Audience

**Primary**: Web developers building WebAuthn/passkey authentication flows
- Frontend developers integrating passkeys
- Full-stack developers debugging authentication issues
- Developer advocates creating demos and tutorials

## Supported Browsers

| Browser | Priority | Extension API |
|---------|----------|---------------|
| Chrome  | P0       | Chrome DevTools Protocol |
| Edge    | P0       | Chrome DevTools Protocol (Chromium-based) |
| Firefox | P1       | WebExtensions DevTools API |
| Safari  | P2       | Safari Web Extensions |

## Functional Requirements

### FR1: API Interception

The extension must capture calls to:
- `navigator.credentials.create()` - Registration/attestation
- `navigator.credentials.get()` - Authentication/assertion
- `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`
- `PublicKeyCredential.isConditionalMediationAvailable()`
- `PublicKeyCredential.getClientCapabilities()` (where supported)
- `PublicKeyCredential.signalUnknownCredential()` (Signal API)
- `PublicKeyCredential.signalAllAcceptedCredentials()` (Signal API)
- `PublicKeyCredential.signalCurrentUserDetails()` (Signal API)

### FR2: Data Display

#### Request Parameters
For `create()` calls, display:
- `rp`: Relying party ID and name
- `user`: User ID, name, and display name
- `challenge`: Decoded challenge value
- `pubKeyCredParams`: Supported algorithms (with human-readable names)
- `timeout`: Timeout value in ms
- `excludeCredentials`: List of excluded credential IDs
- `authenticatorSelection`:
  - `authenticatorAttachment` (platform/cross-platform)
  - `residentKey` (required/preferred/discouraged)
  - `userVerification` (required/preferred/discouraged)
- `attestation`: Attestation preference
- `extensions`: Any requested extensions

For `get()` calls, display:
- `rpId`: Relying party ID
- `challenge`: Decoded challenge value
- `timeout`: Timeout value in ms
- `allowCredentials`: List of allowed credential IDs
- `userVerification`: User verification requirement
- `extensions`: Any requested extensions
- `mediation`: Mediation requirement (conditional, optional, required, silent)

#### Response Data
For successful responses, display:
- `id` / `rawId`: Credential ID (base64url and hex)
- `type`: Credential type
- `authenticatorAttachment`: Attachment modality
- `response`:
  - For attestation: `clientDataJSON`, `attestationObject` (parsed)
  - For assertion: `clientDataJSON`, `authenticatorData`, `signature`, `userHandle`
- `clientExtensionResults`: Extension outputs

For errors, display:
- Error type (NotAllowedError, InvalidStateError, etc.)
- Error message
- Stack trace (if available)

### FR3: Data Formatting

- **ArrayBuffer values**: Display as base64url with option to copy as hex or raw bytes
- **Timestamps**: Show relative time (e.g., "2s ago") and absolute time
- **Challenge**: Verify and display if it appears to be properly random
- **Credential IDs**: Truncated display with full value on hover/click
- **COSE algorithm IDs**: Show human-readable names (e.g., "-7" → "ES256")

### FR6: Attestation Object Parsing

The `attestationObject` must be CBOR-decoded and the `authData` binary structure parsed to extract and display authenticator flags.

#### Authenticator Data Flags

The flags byte (offset 32 in `authData`) contains critical information about the credential:

```
Bit 0 (0x01): UP - User Present
Bit 2 (0x04): UV - User Verified
Bit 3 (0x08): BE - Backup Eligibility (passkey can sync)
Bit 4 (0x10): BS - Backup State (passkey IS synced)
Bit 6 (0x40): AT - Attested Credential Data included
Bit 7 (0x80): ED - Extension Data included
```

**Display format:**
- Show flags in a **vertical list** with checkmark/circle icons
- Each flag shows: icon (✓/○), abbreviation (UP, UV, etc.), and full name
- True flags are highlighted in green, false flags are dimmed
- Flags are displayed inline within the Response tab (not a separate tab)

### FR4: DevTools Panel

- Dedicated "WebAuthn" panel in browser DevTools
- List view of all captured API calls (chronological)
- Detail view showing full request/response data
- Clear button to reset captured data
- Filter/search functionality
- Data is preserved across page navigations (only cleared manually or when tab is closed)

### FR7: Data Export

Export captured WebAuthn calls for sharing, debugging, or documentation purposes.

**Export Format (JSON):**
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:32:45.123Z",
  "origin": "https://example.com",
  "calls": [
    {
      "id": "uuid-1234",
      "type": "create",
      "timestamp": "2024-01-15T10:32:15.000Z",
      "duration": 234,
      "status": "success",
      "request": {
        "rp": { "id": "example.com", "name": "Example Site" },
        "user": { "id": "base64url...", "name": "alice@example.com", "displayName": "Alice" },
        "challenge": "base64url...",
        "pubKeyCredParams": [{ "type": "public-key", "alg": -7 }],
        "authenticatorSelection": { ... },
        "attestation": "none"
      },
      "response": {
        "id": "base64url...",
        "rawId": "base64url...",
        "type": "public-key",
        "authenticatorAttachment": "platform",
        "response": {
          "clientDataJSON": "base64url...",
          "attestationObject": "base64url..."
        },
        "clientExtensionResults": {},
        "flags": {
          "UP": true,
          "UV": true,
          "BE": true,
          "BS": true,
          "AT": true,
          "ED": false
        }
      }
    }
  ]
}
```

**Export Options:**
- Export all captured calls
- Export selected call(s)
- Copy single call to clipboard (for quick sharing)

### FR8: Virtual Authenticator Integration

Integrate with Chrome DevTools' built-in WebAuthn virtual authenticator environment via the Chrome DevTools Protocol (CDP).

**Features:**
- Detect when virtual authenticator environment is enabled
- Display virtual authenticator status in the panel header
- Capture credentials registered with virtual authenticators
- Show which virtual authenticator handled each request (when multiple are configured)

**CDP Integration:**
Use the `WebAuthn` domain of Chrome DevTools Protocol:
- `WebAuthn.enable()` / `WebAuthn.disable()` - Enable virtual authenticator environment
- `WebAuthn.addVirtualAuthenticator()` - Create virtual authenticators
- `WebAuthn.getCredentials()` - List credentials on a virtual authenticator
- `WebAuthn.credentialAdded` / `WebAuthn.credentialAsserted` - Events for credential operations

**UI Indicator:**
```
┌─────────────────────────────────────────────────────────┐
│ WebAuthn  [🔧 Virtual Env]    [Export] [Clear] [Settings]│
└─────────────────────────────────────────────────────────┘
```
When virtual authenticator environment is active, show indicator badge.

**Benefits:**
- Unified view of WebAuthn calls regardless of real or virtual authenticator
- Easier testing workflow without switching between DevTools panels
- See captured parameters alongside virtual authenticator state

### FR5: Call Timeline

- Visual timeline showing:
  - Call initiation timestamp
  - User interaction period (gesture wait time)
  - Response/error timestamp
  - Total duration

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    DevTools Panel                        │
│                   (React/Preact UI)                      │
└─────────────────────┬───────────────────────────────────┘
                      │ Message passing
┌─────────────────────▼───────────────────────────────────┐
│                  Background Script                       │
│              (State management, routing)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ Message passing
┌─────────────────────▼───────────────────────────────────┐
│                   Content Script                         │
│            (API interception, data capture)              │
└─────────────────────────────────────────────────────────┘
```

### Injection Strategy

The content script must inject **before page scripts run** to wrap the WebAuthn APIs:
1. Use `"run_at": "document_start"` in manifest
2. Inject a script element that wraps `navigator.credentials.create/get`
3. Preserve original functionality while capturing parameters and results
4. Handle both Promise resolution and rejection

### Data Flow

1. Page calls `navigator.credentials.create(options)`
2. Injected wrapper captures `options` object
3. Original API is called
4. Response/error is captured
5. Data is serialized (ArrayBuffers → base64url)
6. Message sent to content script → background script → DevTools panel
7. Panel updates UI with new entry

## User Interface

### Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│ WebAuthn                      [Export] [Clear] [Settings]│
├─────────────────────────────────────────────────────────┤
│ Filter: [________________] [All ▼]                      │
├───────────────────────┬─────────────────────────────────┤
│ ● create() 10:32:15   │ [Request] [Response]            │
│   success 234ms       │ ─────────────────────────────── │
│                       │ ATTESTATION CREDENTIAL          │
│ ○ get() 10:32:45      │                                 │
│   pending...          │ id: "abcd1234..."               │
│                       │ rawId: "abcd1234..."            │
│                       │ type: "public-key"              │
│                       │ response:                       │
│                       │   clientDataJSON: "eyJ0eXB..."  │
│                       │   ┌─ CLIENTDATA (PARSED) ─────┐ │
│                       │   │ type: "webauthn.create"   │ │
│                       │   │ challenge: "SGVsbG8..."   │ │
│                       │   │ origin: "https://..."     │ │
│                       │   └───────────────────────────┘ │
│                       │   attestationObject: "o2Nm..."  │
│                       │   ┌─ ATTESTATION (PARSED) ────┐ │
│                       │   │ fmt: "none"               │ │
│                       │   │ authData:                 │ │
│                       │   │   rpIdHash: "49960de..."  │ │
│                       │   │   flags:                  │ │
│                       │   │     ✓ UP (User Present)   │ │
│                       │   │     ✓ UV (User Verified)  │ │
│                       │   │     ✓ BE (Backup Elig.)   │ │
│                       │   │     ✓ BS (Backup State)   │ │
│                       │   │     ✓ AT (Cred. Data)     │ │
│                       │   │     ○ ED (Extensions)     │ │
│                       │   │   signCount: 0            │ │
│                       │   └───────────────────────────┘ │
│                       │ clientExtensionResults: {}      │
└───────────────────────┴─────────────────────────────────┘
```

**Key UI features:**
- Two tabs: Request and Response (no separate Parsed tab)
- Parsed data (clientData, attestation/authData) displayed inline as collapsible blocks
- Flags displayed vertically within the parsed authData section

### Status Indicators

- 🟢 Success - API call completed successfully
- 🔴 Error - API call failed with error
- 🟡 Pending - Waiting for user interaction/response
- ⚪ Cancelled - User cancelled or timeout

## Non-Functional Requirements

### Performance
- Injection must complete before any page JavaScript executes
- Panel updates should not block the main thread
- Memory usage should remain stable with 100+ captured calls

### Privacy
- No data is sent to external servers
- All captured data stays local to the browser
- Clear data option removes all captured information

### Compatibility
- Support Manifest V3 (Chrome, Edge, Firefox)
- Graceful degradation for Safari Web Extensions limitations

## Future Considerations (Post-MVP)

These features are explicitly out of scope for MVP but should inform architecture decisions:

1. **Security Auditing**
   - Warn about weak configurations
   - Check challenge entropy
   - Validate RP ID against origin

2. **Mock Responses**
   - Simulate authenticator responses
   - Test error handling
   - Inject custom errors for testing error handling

3. **Import/Replay**
   - Import previously exported sessions
   - Replay captured calls for testing

4. **Conditional UI Debugging**
   - Visualize autofill integration
   - Track credential availability checks

## Success Metrics

- Developers can identify WebAuthn configuration issues without console.log debugging
- Time to diagnose common WebAuthn issues reduced
- Extension installs and active usage growth

## Open Questions

1. How should we handle iframes and cross-origin WebAuthn calls?

## Appendix

### WebAuthn API Reference
- [Web Authentication Spec](https://w3c.github.io/webauthn/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

### Related Tools
- Chrome DevTools WebAuthn tab (built-in virtual authenticator)
- Firefox WebAuthn debugging tools
