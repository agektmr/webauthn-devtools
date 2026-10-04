# Remove `debugger` permission and prepare Chrome Web Store packaging

## Background

WebAuthn DevTools declared the `"debugger"` permission in `src/manifests/manifest.chrome.json` solely to query `WebAuthn.getAuthenticators` over the Chrome DevTools Protocol when opening the panel and display a `Virtual Auth` / `No Virtual Auth` badge in the toolbar. Attaching `chrome.debugger` triggers a persistent browser-wide `"WebAuthn DevTools started debugging this browser"` warning banner and complicates Chrome Web Store review, even though all WebAuthn API interception and CBOR/COSE decoding work entirely through page-context script injection without `debugger`. In addition, production store packages should exclude `.map` sourcemaps, support signed `.crx` packaging alongside `.zip` archives, allow optional build-time `"key"` injection for local unpacked development, and consolidate agent instructions into `.agents/AGENTS.md`.

## Requirement

Remove the `"debugger"` permission and unused CDP virtual authenticator status check so the extension requests zero API permissions under `"permissions"`. Consolidate `CLAUDE.md` into `.agents/AGENTS.md` with `CLAUDE.md` symlinked as an alias, exclude `.map` sourcemaps from production builds, add a CRX3 packaging script (`npm run build:crx:chrome`), support optional `EXTENSION_KEY` / `EXTENSION_KEY_FILE` injection via `npm run build:chrome:dev`, and document Chrome Web Store listing metadata and permission justifications in `CHROMEWEBSTORE.md`.

## Acceptance criteria

`src/manifests/manifest.chrome.json` no longer requests `"debugger"`, and `src/background/cdp.ts` and `src/devtools/panel/hooks/useVirtualAuthStatus.ts` are removed along with the toolbar badge. `.agents/AGENTS.md` contains the canonical repository documentation and `CLAUDE.md` is a relative symlink (`CLAUDE.md -> .agents/AGENTS.md`). Production builds (`npm run build:chrome`) exclude `.map` sourcemaps and produce `webauthn-devtools-chrome-v{version}.zip`, while `npm run build:crx:chrome` produces a signed CRX3 archive (`webauthn-devtools-chrome-v{version}.crx`) using an untracked `.pem` key. Local development builds (`npm run build:chrome:dev` and `npm run dev`) optionally inject `"key"` from `EXTENSION_KEY` or `EXTENSION_KEY_FILE` (including `.env.local`) into `dist/chrome/manifest.json`, and both `build-zip.js` and `build-crx.js` reject manifests containing a `"key"` field.
