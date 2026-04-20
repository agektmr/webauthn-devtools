# Add `topOrigin` Parameter to Client Data

## Background

The WebAuthn client data (`CollectedClientData`) includes an optional
`topOrigin` field per the W3C WebAuthn Level 3 specification. It carries
the origin of the top-level browsing context when the WebAuthn call
originates from inside a cross-origin iframe. The current DevTools
extension parses and exposes `type`, `challenge`, `origin`, `crossOrigin`,
and `tokenBinding`, but drops `topOrigin`, so it does not appear in the
decoded "clientData (parsed)" view.

## Requirement

Surface `topOrigin` in the parsed client data so developers can verify
the value the client sent when debugging cross-origin (iframe) flows.

## Acceptance Criteria

1. `ParsedClientData` includes an optional `topOrigin: string` field.
2. `parseClientData()` extracts `topOrigin` from the decoded JSON and
   forwards it to the returned object.
3. The field is displayed automatically by the existing JsonView
   rendering in the Call Detail panel (no additional UI work needed).
