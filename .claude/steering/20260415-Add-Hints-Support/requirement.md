# Add `hints` Parameter Support - Requirements

## Problem

The WebAuthn `hints` parameter on both `navigator.credentials.create()` and
`navigator.credentials.get()` was not captured by the DevTools extension.
When a page invokes either API with a `hints: ['security-key']` (or any other
`PublicKeyCredentialHints` value), the panel did not display it in the request
view — the field was silently dropped during serialization.

`hints` is a first-class WebAuthn option used to tell the client which kind of
authenticator UI to emphasize (`'security-key'`, `'client-device'`, `'hybrid'`).
Developers debugging passkey flows need to verify the value they actually pass
to the browser.

## Goals

1. Capture the `hints` array from `PublicKeyCredentialCreationOptions` and
   `PublicKeyCredentialRequestOptions` and include it in the serialized request.
2. Display the captured `hints` value in the DevTools request panel.
3. Surface the existing documentation link next to the `hints` key so users can
   learn about the feature from the panel.

## Non-Goals

- Validating or translating `hints` values.
- Supporting browser-specific hint extensions beyond the spec list.
- Re-implementing the `hints` semantics — we only capture/display.

## Acceptance Criteria

- [x] `serializeCreateRequest` includes `hints` when the caller provides it.
- [x] `serializeGetRequest` includes `hints` when the caller provides it.
- [x] Unit tests cover both serializers with and without `hints`.
- [x] The panel's JSON viewer renders `hints` for create and get requests.
- [x] The existing `hints` InfoLink is automatically rendered next to the key.
- [x] No regressions in existing unit tests or the Chrome build.
