<!--
Copyright 2025 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Agent context and guidelines for WebAuthn DevTools

## Project overview and architecture

WebAuthn DevTools is a multi-browser DevTools extension (Chrome, Edge, Firefox, and Safari) that captures WebAuthn API interactions on the inspected page and displays them in a dedicated **WebAuthn** DevTools panel for debugging passkey implementations. It intercepts `navigator.credentials.create()`, `navigator.credentials.get()`, and `PublicKeyCredential` static methods (`isUserVerifyingPlatformAuthenticatorAvailable`, `getClientCapabilities`, and the WebAuthn Signal API methods `signalUnknownCredential`, `signalAllAcceptedCredentials`, and `signalCurrentUserDetails`), decoding raw binary buffers into human-readable structures with inline links to the [W3C WebAuthn specification](https://w3c.github.io/webauthn/) and [IANA COSE registries](https://www.iana.org/assignments/cose/cose.xhtml).

To minimize runtime overhead on pages where debugging is not needed, the extension uses conditional activation and only injects the page-level interceptor when the DevTools panel is actively open. The content script loads at `document_start` and sends `CONTENT_READY` to the background service worker without injecting into the page context. When the user opens the WebAuthn DevTools panel, the React panel establishes a persistent `chrome.runtime.connect()` port and sends `PANEL_OPENED` to the background service worker, which responds with current state via `CALLS_UPDATE` and sends `ACTIVATE_TAB` to the content script so the IIFE interceptor (`injected.js`) is injected into the page. Captured calls (`CALL_START`, `CALL_SUCCESS`, `CALL_ERROR`) are posted via `window.postMessage`, relayed by the content script to the background service worker, preserved across page navigations until the user clicks Clear or closes the tab, and streamed to the panel UI.

## Directory structure

- `src/injected/`: Page-context interceptor bundled separately via `vite.config.injected.ts` as a self-contained IIFE (`injected.js`) that wraps `navigator.credentials` and `PublicKeyCredential` APIs.
- `src/content/`: Content script acting as the message relay between `window.postMessage` in the page context and `chrome.runtime.sendMessage` in the extension context.
- `src/background/`: Background service worker managing per-tab call history state and DevTools panel port connections.
- `src/devtools/`: DevTools entry page (`index.html` / `devtools.ts`) and React panel UI (`src/devtools/panel/`) including `CallList`, `CallDetail`, `FlagsDisplay`, `JsonView`, `InfoLink`, and `Toolbar`.
- `src/parsers/`: Binary parsers for `clientDataJSON`, `authenticatorData` (RP ID hash, `UP`/`UV`/`BE`/`BS`/`AT`/`ED` flags at byte offset 32, sign counter, AAGUID lookup, attested credential data), `attestationObject` (CBOR), and COSE public keys.
- `src/shared/`: Shared TypeScript interfaces, message constants, specification link definitions, and `base64url` serialization helpers for `ArrayBuffer` transport.
- `src/manifests/`: Browser-specific Manifest V3 configuration files (`manifest.chrome.json`, `manifest.firefox.json`, `manifest.safari.json`).
- `scripts/`: Packaging utilities for building store `.zip` archives (`scripts/build-zip.js`) and signed CRX3 `.crx` packages (`scripts/build-crx.js`).
- `PRD.md`, `PDD.md`, and `CHROMEWEBSTORE.md`: Product requirements, technical design documentation, and Chrome Web Store publishing guide.

## Build, local development, and packaging

- `npm run dev`: Runs Vite in watch mode (`dist/chrome/`) with sourcemaps enabled and optional developer public key injection (`EXTENSION_KEY` or `EXTENSION_KEY_FILE` in `.env.local`).
- `npm run build:chrome`: Runs TypeScript type checking, builds the main bundle and `injected.js` IIFE without sourcemaps into `dist/chrome/`, and packages `webauthn-devtools-chrome-v{version}.zip` for Chrome Web Store upload.
- `npm run build:chrome:dev`: Builds `dist/chrome/` with sourcemaps and optional developer `"key"` injection from `EXTENSION_KEY` or `EXTENSION_KEY_FILE` (including `.env.local`) to preserve a stable extension ID during local `Load unpacked` testing.
- `npm run build:crx:chrome`: Packages `dist/chrome/` into a signed CRX3 archive (`webauthn-devtools-chrome-v{version}.crx`) using an untracked `webauthn-devtools.pem` private key (or `CRX_KEY_FILE`).
- `npm run build:firefox` / `npm run build:safari`: Builds extension bundles and `.zip` archives for Firefox (`dist/firefox/`) and Safari (`dist/safari/`).
- `npm run test:run`: Runs the Vitest unit test suite (`tests/unit/**/*.test.ts`).
- `npx playwright test`: Runs Playwright end-to-end browser tests (`tests/e2e/`).

To load the extension locally in Chrome or Edge, run `npm run build:chrome` (or `npm run build:chrome:dev` when using a local developer public key), open `chrome://extensions`, enable Developer mode, and click Load unpacked to select `dist/chrome/`. To load in Firefox, run `npm run build:firefox`, open `about:debugging#/runtime/this-firefox`, click Load Temporary Add-on, and select any file in `dist/firefox/`.

## Coding standards, steering documents, and Git worktree workflow

All `.ts`, `.tsx`, and `.js` files must begin with the standard Apache 2.0 license header (`Copyright 2025 Eiji Kitamura`). Follow Google's TypeScript style guide, prefer explicit types over `any`, use functional React components with hooks, and serialize all `ArrayBuffer` values as `base64url` strings when passing messages across contexts. Whenever starting a new task, create a steering document (`requirement.md` and `design.md`) under `.claude/steering/[YYYYMMDD]-[Task title]/`.

When developing features, fixing bugs, or preparing releases, use Git Worktrees under `.worktree/<branch-name>` (`git worktree add .worktree/<branch-name> -b <branch-name> origin/main`) instead of switching branches in the repository root. Carry out all code modifications, local testing, and commits inside `.worktree/<branch-name>`, wait for user review before running `git commit`, and clean up the worktree (`git worktree remove .worktree/<branch-name>`) once the pull request is merged.

<!-- END_OF_AGENTS_MD -->
