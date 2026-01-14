# Design - Add InfoLink Tooltips for WebAuthn Concepts

## Approach

### 1. Centralized Documentation Mapping
The `src/devtools/panel/utils/docLinks.ts` file stores the mapping between WebAuthn property/method names and their documentation.

### 2. `InfoLink` Component
A reusable `InfoLink` component in `src/devtools/panel/components/InfoLink.tsx` displays an info icon (ⓘ) and shows a tooltip on hover.

### 3. Documentation URLs
The following properties and methods are mapped to their respective documentation:

| Property / Method | Documentation URL |
|-------------------|-------------------|
| `userVerification` | https://web.dev/articles/webauthn-user-verification |
| `discoverableCredentials` | https://web.dev/articles/webauthn-discoverable-credentials |
| `allowCredentials` | https://web.dev/articles/webauthn-discoverable-credentials |
| `residentKey` | https://web.dev/articles/webauthn-discoverable-credentials |
| `requireResidentKey` | https://web.dev/articles/webauthn-discoverable-credentials |
| `excludeCredentials` | https://web.dev/articles/webauthn-exclude-credentials |
| `aaguid` | https://web.dev/articles/webauthn-aaguid |
| `signalUnknownCredential` | https://developer.chrome.com/docs/identity/webauthn-signal-api |
| `signalAllAcceptedCredentials` | https://developer.chrome.com/docs/identity/webauthn-signal-api |
| `signalCurrentUserDetails` | https://developer.chrome.com/docs/identity/webauthn-signal-api |
| `getClientCapabilities` | https://web.dev/articles/webauthn-client-capabilities |
| `mediation:conditional` | https://developer.chrome.com/docs/identity/webauthn-conditional-create |

## Files Modified
1. `src/devtools/panel/utils/docLinks.ts` - Documentation mapping
2. `src/devtools/panel/components/InfoLink.tsx` - Tooltip component
3. `src/devtools/panel/components/JsonView.tsx` - Integrated tooltips into JSON view
4. `src/devtools/panel/components/CallDetail.tsx` - Added tooltips to specific fields (`aaguid`, `mediation`)
