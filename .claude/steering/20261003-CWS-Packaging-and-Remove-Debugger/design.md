# Design for removing `debugger` permission and Chrome Web Store packaging

## Affected files

`src/manifests/manifest.chrome.json`, `src/background/cdp.ts`, `src/background/index.ts`, `src/background/state.ts`, `src/devtools/panel/hooks/useVirtualAuthStatus.ts`, `src/devtools/panel/components/Toolbar.tsx`, `src/devtools/panel/App.tsx`, `src/devtools/panel/index.css`, `src/shared/messages.ts`, `src/shared/types.ts`, `tests/setup.ts`, and `tests/unit/state.test.ts` are updated to remove the `"debugger"` permission and CDP virtual authenticator status check. `.agents/AGENTS.md` replaces the standalone `CLAUDE.md`, which is converted into a relative symbolic link (`CLAUDE.md -> .agents/AGENTS.md`). `.gitignore` is updated to ignore `*.crx`, `*.pem`, and `*.key` files, while `tsconfig.json` and `vitest.config.ts` exclude `.worktree/`. Build and packaging updates in `vite.config.ts`, `vite.config.injected.ts`, `scripts/build-zip.js`, `scripts/build-crx.js`, and `package.json` support clean `.zip` builds, signed `.crx` builds, and local unpacked development builds, while `CHROMEWEBSTORE.md` documents the Chrome Web Store publishing workflow.

## Approach

Removing `src/background/cdp.ts` and `useVirtualAuthStatus.ts` eliminates all `chrome.debugger` calls so the extension relies purely on page-context script injection (`src/injected/index.ts`) and content script message relaying (`src/content/index.ts`).

In `vite.config.ts` and `vite.config.injected.ts`, sourcemaps are generated only when `SOURCEMAP=true` or `INJECT_KEY=true` is set, keeping production `dist/chrome` bundles free of `.map` files. When `INJECT_KEY=true` (or `EXTENSION_KEY` / `EXTENSION_KEY_FILE`) is provided during a Chrome build, `copyStaticAssets()` in `vite.config.ts` reads the developer public key from `EXTENSION_KEY` or `EXTENSION_KEY_FILE` (including `.env.local`) and writes it into `dist/chrome/manifest.json` without touching `src/manifests/manifest.chrome.json`.

For Chrome Web Store publishing, `npm run build:chrome` outputs `webauthn-devtools-chrome-v{version}.zip` without any `"key"` or local signature, while `npm run build:crx:chrome` (`scripts/build-crx.js`) signs the clean `.zip` payload with an untracked `webauthn-devtools.pem` key (or `CRX_KEY_FILE`) into a CRX3 binary (`webauthn-devtools-chrome-v{version}.crx`) using Node's built-in `crypto` module.
