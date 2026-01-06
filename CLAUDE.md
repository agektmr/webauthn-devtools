# WebAuthn DevTools Extension

A browser DevTools extension that captures WebAuthn API interactions and displays them in a dedicated panel for debugging.

## Project Overview

This extension helps web developers debug WebAuthn/passkey implementations by:
- Intercepting `navigator.credentials.create()` and `navigator.credentials.get()` calls
- Capturing PublicKeyCredential static methods (availability checks, Signal API)
- Displaying request parameters and responses in human-readable format
- Parsing authenticator data flags (UP, UV, BE, BS, AT, ED)
- Integrating with Chrome's virtual authenticator environment

## Architecture

```
DevTools Panel opens
    ↓ PANEL_OPENED
Service Worker (Background)
    ↓ ACTIVATE_TAB
Content Script
    ↓ injects script
Web Page (Injected Script)
    ↓ window.postMessage (WebAuthn events)
Content Script
    ↓ chrome.runtime.sendMessage
Service Worker (Background)
    ↓ chrome.runtime.connect
DevTools Panel (React)
```

**Note:** The extension only activates monitoring when the DevTools panel is open. This minimizes overhead on pages where debugging is not needed.

## Key Files

- `src/injected/` - Runs in page context, wraps WebAuthn APIs
- `src/content/` - Message relay between page and extension
- `src/background/` - Service worker, state management, CDP client
- `src/devtools/panel/` - React UI components
- `src/shared/` - Types, constants, message definitions
- `src/parsers/` - CBOR, authData, attestationObject parsers
- `src/manifests/` - Browser-specific manifest.json files

## Build Commands

```bash
npm install            # Install dependencies
npm run dev            # Watch mode build (Chrome)
npm run build          # Production build (both browsers)
npm run build:chrome   # Build Chrome only → dist/chrome/
npm run build:firefox  # Build Firefox only → dist/firefox/
npm run test           # Run unit tests
npx playwright test    # Run e2e tests
```

**Output:**
- `dist/chrome/` - Chrome/Edge extension files
- `dist/firefox/` - Firefox extension files
- `webauthn-devtools-chrome-v{version}.zip` - Chrome Web Store upload
- `webauthn-devtools-firefox-v{version}.zip` - Firefox Add-ons upload

**Note:** Sourcemaps are enabled for all builds to aid debugging.

## Loading the Extension

**Chrome/Edge:**
1. Run `npm run build:chrome`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `dist/chrome/` folder

**Firefox:**
1. Run `npm run build:firefox`
2. Open Firefox → `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select any file in `dist/firefox/` folder

## Code Style

- Follow Google's TypeScript style guide
- Use functional components with hooks for React
- Prefer explicit types over `any`
- Use `base64url` encoding for all ArrayBuffer serialization

## Steering documents

Create a steering document everytime you are asked to work on a new task.
The file should be stored as the following place.

/.claude/steering/[YYYYMMDD]-[Task title]/

## License

This project is licensed under Apache 2.0. **All source files must include the license header:**

```typescript
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
```

Add this header at the top of every `.ts`, `.tsx`, and `.js` file before any other code or comments.

## Important Technical Details

### ArrayBuffer Serialization

All ArrayBuffer values must be converted to base64url for message passing:
```typescript
// Encode
const base64url = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

// Decode
const binary = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'));
```

### AuthData Flags (offset 32, 1 byte)

```
Bit 0 (0x01): UP - User Present
Bit 2 (0x04): UV - User Verified
Bit 3 (0x08): BE - Backup Eligibility
Bit 4 (0x10): BS - Backup State
Bit 6 (0x40): AT - Attested Credential Data included
Bit 7 (0x80): ED - Extension Data included
```

### Message Flow

1. Injected script posts `CALL_START` with serialized request
2. Original WebAuthn API is called
3. On completion, posts `CALL_SUCCESS` or `CALL_ERROR`
4. Content script relays to service worker
5. Service worker updates state and notifies panel via port connection

### Panel Connection

The DevTools panel uses `chrome.runtime.connect()` for persistent communication:
1. Panel sets up message listener BEFORE sending `PANEL_OPENED`
2. Background responds with current state via `CALLS_UPDATE`
3. This ordering prevents race conditions where panel misses initial data

### Data Persistence

- **Calls are preserved across page navigations** - not cleared on navigation or refresh
- Users can manually clear calls using the Clear button in the panel
- Call history is only cleared when the tab is closed

### Conditional Activation

The extension only injects WebAuthn interceptors when the DevTools panel is open:

1. Content script loads at `document_start` but does NOT inject interceptors automatically
2. Content script sends `CONTENT_READY` to background
3. If DevTools panel is open, background sends `ACTIVATE_TAB` to content script
4. Content script then injects the interceptor script

**Important:** If DevTools is opened after WebAuthn calls have occurred, those calls will be missed. The user must reload the page to capture subsequent calls.

## Testing

- Use WebAuthn test vectors from W3C/FIDO Alliance for parser tests
- Test with Chrome's built-in virtual authenticator (DevTools → More tools → WebAuthn)
- Test sites: webauthn.io, passkeys.dev

## Browser Support

| Browser | Support Level |
|---------|--------------|
| Chrome  | Full (CDP for virtual auth) |
| Edge    | Full (Chromium-based) |
| Firefox | Core features only |
| Safari  | Core features only |

## References

- [PRD.md](./PRD.md) - Product requirements
- [PDD.md](./PDD.md) - Technical design
- [WebAuthn Spec](https://w3c.github.io/webauthn/)
- [COSE Algorithms](https://www.iana.org/assignments/cose/cose.xhtml)
