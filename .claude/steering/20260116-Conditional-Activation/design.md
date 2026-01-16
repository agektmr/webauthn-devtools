# Conditional Activation - Design

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

## New Message Types

Added to `src/shared/messages.ts`:
- `CONTENT_READY` - Content script → Background: ready for activation
- `ACTIVATE_TAB` - Background → Content script: inject now

## Flow Scenarios

### Flow 1: User opens panel, then navigates to page
```
Panel opens → PANEL_OPENED → addConnection()
                          → sendMessage(ACTIVATE_TAB) [no content script yet]
Page loads → Content script → CONTENT_READY
          → Background checks hasConnection() = true
          → sendMessage(ACTIVATE_TAB)
          → Content script injects → APIs wrapped
```

### Flow 2: Page loaded, then user opens panel
```
Page loads → Content script → CONTENT_READY
          → Background checks hasConnection() = false → no action
User opens panel → PANEL_OPENED → addConnection()
                               → sendMessage(ACTIVATE_TAB)
                               → Content script injects → APIs wrapped
```

### Flow 3: Page navigates while panel open
```
Panel already open (connection exists)
Page navigates → Content script destroyed
New page loads → New content script → CONTENT_READY
             → Background checks hasConnection() = true
             → sendMessage(ACTIVATE_TAB)
             → Content script injects → APIs wrapped
```

## Files Modified

| File | Change |
|------|--------|
| `src/shared/messages.ts` | Add `CONTENT_READY` and `ACTIVATE_TAB` message types |
| `src/content/index.ts` | Don't auto-inject; listen for activation; send ready on load |
| `src/background/index.ts` | Send activation on panel open and on content ready |
| `CLAUDE.md` | Updated architecture diagram and documentation |
| `README.md` | Updated usage instructions and architecture |
| `PDD.md` | Updated high-level architecture and message protocol |
