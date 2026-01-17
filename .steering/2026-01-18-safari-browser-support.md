# Safari Browser Support

## Summary

Added full Safari support to the WebAuthn DevTools extension, enabling the extension to function in Safari's Web Inspector.

## Changes Made

### New Files
- `src/manifests/manifest.safari.json` - Safari-specific manifest with `scripts` background (not service worker)
- `src/browser.d.ts` - TypeScript declaration for `browser` global

### Build System
- `package.json` - Added `build:safari` and `build:zip:safari` scripts
- `scripts/build-zip.js` - Added Safari browser validation and success message
- `vite.config.ts` - Added Safari manifest selection, `MINIFY` env var option
- `vite.config.injected.ts` - Added `MINIFY` env var option for consistency
- `README.md` - Updated with Safari installation instructions

### Cross-Browser Compatibility (chrome → browser namespace)
- `src/background/index.ts` - Migrated to `browser.*` APIs with inline polyfill
- `src/background/cdp.ts` - Added debugger availability check for Safari
- `src/background/connections.ts` - Added Safari broadcast support (tabId=-1)
- `src/content/index.ts` - Migrated to `browser.*` with inline polyfill
- `src/devtools/index.ts` - Migrated to `browser.*` with inline polyfill
- `src/devtools/panel/index.tsx` - Added inline polyfill
- `src/devtools/panel/hooks/useWebAuthnCalls.ts` - Added Safari polling fallback
- `src/devtools/panel/hooks/useVirtualAuthStatus.ts` - Migrated to `browser.*`
- `src/devtools/panel/components/InfoLink.tsx` - Use OPEN_URL message for links
- `src/shared/messages.ts` - Added OPEN_URL payload type

## Safari-Specific Workarounds

### 1. Tab ID = -1
Safari's `browser.devtools.inspectedWindow.tabId` returns `-1`. The background script queries the active tab instead.

### 2. Port Disconnection
Safari immediately disconnects `runtime.connect()` ports. The panel uses polling (every 500ms) via `runtime.sendMessage` to get updates.

### 3. Content Script Messaging
Safari's `browser.tabs.sendMessage` is unreliable. The content script injects interceptors immediately on Safari, while Chrome/Firefox wait for `ACTIVATE_TAB`.

### 4. DevTools Panel Links
`window.open()` doesn't work in Safari DevTools panels. Links are opened via `OPEN_URL` message to background script.

### 5. Browser Polyfill
Chrome requires `browser` to be aliased to `chrome`. The polyfill is inlined in each entry point to avoid ES module imports in content scripts.

## Testing

- Chrome: ✅ Works with DevTools-only capture
- Firefox: ✅ Works with DevTools-only capture
- Safari: ✅ Works with always-capture (due to messaging limitations)

## Usage

```bash
# Build all browsers
npm run build

# Build Safari only
npm run build:safari

# Build without minification (for store submissions)
MINIFY=false npm run build:safari
```
