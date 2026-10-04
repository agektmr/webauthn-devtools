# Chrome Web Store listing and packaging guide

## Store listing metadata

Set the extension name in the Chrome Web Store to **WebAuthn DevTools**, accompanied by the short description below (119 characters, within the 132-character limit):

> Inspect, capture, and debug passkey registration, authentication, and WebAuthn Signal API calls inside Chrome DevTools.

Set the store category to **Developer Tools** and the primary language to **English**.

## Detailed store description

WebAuthn DevTools adds a dedicated **WebAuthn** panel to Chrome DevTools so web developers and security engineers can inspect passkey registration, authentication, and credential state synchronization in real time without deciphering raw binary buffers in the console.

When developing or troubleshooting passkey flows, WebAuthn API calls return opaque `ArrayBuffer` payloads encoded in CBOR, COSE, and binary authenticator data structures. WebAuthn DevTools automatically captures every `navigator.credentials.create()`, `navigator.credentials.get()`, `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`, `PublicKeyCredential.getClientCapabilities()`, and WebAuthn Signal API (`signalUnknownCredential`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`) invocation on the inspected page and presents both the raw arguments and human-readable decoded structures side by side.

Within the DevTools panel, you can inspect decoded `clientDataJSON` fields (including cross-origin `topOrigin` metadata), unpacked `authenticatorData` flags (`UP`, `UV`, `BE`, `BS`, `AT`, `ED`), AAGUID provider names, sign counters, attestation statements, and COSE public key parameters (`kty`, `alg`, `crv`, coordinates, and moduli). Each field includes inline specification tooltips linking directly to the W3C WebAuthn Level 3 specification, RFC 9052/9053 (COSE), and IANA registries, and any payload can be copied as JSON, Base64URL, or Hex with a single click.

## Single purpose statement

Paste the following single purpose statement into the Privacy practices tab in the Chrome Web Store Developer Console:

> Inspect, capture, and debug WebAuthn passkey registration, authentication, and Signal API calls directly inside Chrome DevTools.

## Permission justifications and remote code disclosure

Use the justification below in the Privacy practices tab for the host permission declared in `src/manifests/manifest.chrome.json` (the extension does not request any API permissions under `"permissions"`).

### Host permission justification (`<all_urls>`)

WebAuthn DevTools is a developer debugging tool that must intercept `navigator.credentials` and `PublicKeyCredential` API calls in the page context on whichever relying party origin the developer is actively inspecting—including `localhost`, staging environments, test domains, and production websites. Because WebAuthn calls frequently occur immediately on page load (such as conditional UI autofill via `mediation: "conditional"`), the content script must be registered at `document_start` across all URLs, and the page-level interceptor is conditionally injected only when the developer opens the WebAuthn DevTools panel. All captured data stays strictly within the local browser session and is never transmitted externally.

### Remote code disclosure

Select **No, I am not using Remote code**. All JavaScript, React UI components, and CBOR/COSE parsers are bundled statically inside the extension package, and no external scripts or `eval()` calls are executed.

## Data usage and privacy disclosures

In the Data usage section of the Chrome Web Store Privacy tab, leave all data collection checkboxes **unchecked** and certify all three compliance disclosures. WebAuthn DevTools does not collect, store on external servers, or transmit any personal data, browsing history, or authentication payloads off the user's device. Every captured WebAuthn request and response is held exclusively in volatile memory inside the local browser process for display in the DevTools panel and is cleared when the tab is closed or the user clicks Clear.

## Building store packages (`.zip` and `.crx`)

To build a clean `.zip` archive for Chrome Web Store upload, run:

```bash
npm run build:chrome
```

This command compiles the extension without `.map` sourcemaps, verifies that no local developer `"key"` is present in `dist/chrome/manifest.json`, and outputs `webauthn-devtools-chrome-v{version}.zip` at the project root.

If you prefer to manage your own signing key and upload a signed CRX3 archive (`.crx`)—or if you maintain separate store listings under different developer accounts that require distinct Extension IDs—run:

```bash
npm run build:chrome
npm run build:crx:chrome
```

Running `npm run build:crx:chrome` generates a 2048-bit RSA private key at `webauthn-devtools.pem` on first run (ignored by Git; back this file up securely outside the repository for future updates, or specify a custom key path via `CRX_KEY_FILE=/path/to/key.pem`) and outputs `webauthn-devtools-chrome-v{version}.crx` along with its deterministic 32-character Extension ID.

## Preserving a consistent Extension ID during local unpacked development

When loading `dist/chrome` via `chrome://extensions` (`Load unpacked`), you can optionally inject a static public key into `dist/chrome/manifest.json` so Chrome assigns a consistent Extension ID across local builds without committing the key to Git. Set `EXTENSION_KEY` (Base64-encoded public key) or `EXTENSION_KEY_FILE` (path to a public key file) in `.env.local` (which is ignored by Git) and run:

```bash
npm run build:chrome:dev
```

You can also run `npm run dev` for watch mode. Never upload a build produced with `build:chrome:dev` to the store; both `build:zip:chrome` and `build:crx:chrome` explicitly reject manifests that contain a `"key"` field.
