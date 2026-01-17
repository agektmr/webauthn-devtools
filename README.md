# WebAuthn DevTools

A browser DevTools extension that captures and displays WebAuthn API interactions, helping developers debug passkey and WebAuthn implementations.

## Features

- **API Interception**: Captures calls to `navigator.credentials.create()`, `navigator.credentials.get()`, and PublicKeyCredential static methods
- **Request/Response Display**: Shows request parameters and responses in a human-readable format
- **Data Parsing**: Automatically parses and displays:
  - `clientDataJSON` with decoded challenge and origin
  - `attestationObject` with CBOR-decoded attestation statement
  - `authenticatorData` with flags, sign count, and credential data
  - COSE public keys with algorithm details
- **Authenticator Flags**: Visual display of UP, UV, BE, BS, AT, ED flags
- **Data Persistence**: Calls are preserved across page navigations
- **Export**: Export captured calls as JSON with parsed `clientDataJSON`, `authenticatorData`, and `attestedCredentialData`
- **Virtual Authenticator Detection**: Shows when Chrome's virtual authenticator environment is active

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/user/webauthn-devtools.git
   cd webauthn-devtools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```
   This creates separate builds for each browser:
   - `dist/chrome/` - Chrome/Edge extension
   - `dist/firefox/` - Firefox extension
   - `dist/safari/` - Safari extension (requires Xcode conversion)
   - `webauthn-devtools-chrome-v{version}.zip` - Chrome Web Store upload
   - `webauthn-devtools-firefox-v{version}.zip` - Firefox Add-ons upload
   - `webauthn-devtools-safari-v{version}.zip` - Safari Xcode conversion input

4. Load in browser:

   **Chrome/Edge:**
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/chrome/` folder

   **Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on..."
   - Select any file in the `dist/firefox/` folder

   **Safari (requires macOS with Xcode 12+):**
   - Build Safari extension: `npm run build:safari`
   - Convert using Xcode:
     ```bash
     xcrun safari-web-extension-converter dist/safari --project-location ./safari-extension --app-name "WebAuthn DevTools"
     ```
   - Open the generated Xcode project and build/run the app (Cmd+R)
   - Enable the extension in Safari → Settings → Extensions

## Usage

1. Visit a site that uses WebAuthn (e.g., [webauthn.io](https://webauthn.io))
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Navigate to the "WebAuthn" panel
4. Trigger a registration or authentication flow
5. View the captured calls in the panel

**Note:** The extension only starts monitoring when the DevTools panel is open. If you open DevTools after a WebAuthn call has already occurred, you'll need to reload the page to capture subsequent calls.

### Panel Layout

- **Left pane**: List of captured WebAuthn calls with status indicators
- **Right pane**: Detailed view of the selected call
  - **Request tab**: Shows the options passed to create/get
  - **Response tab**: Shows the credential response with inline parsed data

### Status Indicators

- Green: Successful call
- Red: Failed call (with error details)
- Yellow: Pending (waiting for user interaction)
- Gray: Aborted/cancelled

## Development

### Project Structure

```
webauthn-devtools/
├── src/
│   ├── injected/       # Runs in page context, wraps WebAuthn APIs
│   ├── content/        # Message relay between page and extension
│   ├── background/     # Service worker, state management
│   ├── devtools/       # DevTools panel UI (React)
│   ├── parsers/        # CBOR, authData, COSE key parsers
│   ├── shared/         # Types, constants, messages
│   └── manifests/      # Browser-specific manifest.json files
├── tests/
│   ├── unit/           # Vitest unit tests
│   └── e2e/            # Playwright e2e tests
└── public/             # Static assets (icons)
```

### Commands

```bash
npm run dev            # Watch mode build (Chrome)
npm run build          # Production build (all browsers)
npm run build:chrome   # Build Chrome only
npm run build:firefox  # Build Firefox only
npm run build:safari   # Build Safari only
npm run test           # Run unit tests
npm run test:run       # Run unit tests once
npx playwright test    # Run e2e tests
```

### Architecture

The extension only activates monitoring when the DevTools panel is open:

```
DevTools Panel opens → PANEL_OPENED → Service Worker
                                           ↓ ACTIVATE_TAB
                                      Content Script
                                           ↓ injects
                                      Web Page (Injected Script)
                                           ↓ window.postMessage
                                      Content Script
                                           ↓ chrome.runtime.sendMessage
                                      Service Worker
                                           ↓ port.postMessage
                                      DevTools Panel
```

## Browser Support

| Browser | Support Level |
|---------|--------------|
| Chrome  | Full |
| Edge    | Full (Chromium-based) |
| Firefox | Core features only |
| Safari  | Core features only |

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
npm run test
```

### E2E Tests

Run end-to-end tests with Playwright:

```bash
npx playwright install chromium  # First time only
npx playwright test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm run test && npx playwright test`)
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## References

- [WebAuthn Specification](https://w3c.github.io/webauthn/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [COSE Algorithms Registry](https://www.iana.org/assignments/cose/cose.xhtml)
