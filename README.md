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
- **Export**: Export captured calls as JSON for sharing or documentation
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

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## Usage

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Navigate to the "WebAuthn" panel
3. Visit a site that uses WebAuthn (e.g., [webauthn.io](https://webauthn.io))
4. Trigger a registration or authentication flow
5. View the captured calls in the panel

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
│   └── shared/         # Types, constants, messages
├── tests/
│   ├── unit/           # Vitest unit tests
│   └── e2e/            # Playwright e2e tests
└── public/             # Static assets (manifest, icons)
```

### Commands

```bash
npm run dev       # Watch mode build
npm run build     # Production build
npm run test      # Run unit tests
npm run test:run  # Run unit tests once
npx playwright test  # Run e2e tests
```

### Architecture

```
Web Page (Injected Script)
    ↓ window.postMessage
Content Script
    ↓ chrome.runtime.sendMessage
Service Worker (Background)
    ↓ chrome.runtime.connect
DevTools Panel (React)
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
