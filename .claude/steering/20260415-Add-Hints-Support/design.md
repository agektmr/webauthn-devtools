# Add `hints` Parameter Support - Design

## Overview

The `hints` parameter is a string array attached directly to
`PublicKeyCredentialCreationOptions` and `PublicKeyCredentialRequestOptions`.
Because the installed `lib.dom.d.ts` does not yet describe this field, the
interceptors simply never read it; the serializer therefore emits objects
without `hints` and the panel never sees it.

## Changes

### `src/injected/serializer.ts`

- `serializeCreateRequest`: read `options.hints` via a local cast to
  `PublicKeyCredentialCreationOptions & { hints?: string[] }` and include it
  (as a shallow copy) in the serialized payload.
- `serializeGetRequest`: analogous change for
  `PublicKeyCredentialRequestOptions`.
- Guard with `Array.isArray(hints)` so malformed input does not leak through.
- Shallow-copy the array (`[...hints]`) to avoid retaining a live reference to
  page-provided memory.

### `src/shared/types.ts`

- Add optional `hints?: string[]` to `CreateRequest` and `GetRequest` so
  downstream consumers (panel, tests, export) see the field in the type system.

### Panel

No panel changes are required:

- `JsonView` iterates object keys and consults `hasDocLink(key)` per key, so it
  will automatically attach the existing `hints` `InfoLink` once the serialized
  request contains the `hints` key.
- `CallDetail` renders the request via `<JsonView data={publicKeyOptions} />`
  for both create and get, so the new key renders without additional wiring.

### Tests

Add unit tests to `tests/unit/serializer.test.ts` covering:

- Create: presence of `hints`, absence of `hints`, defensive copy.
- Get: presence of `hints`, absence of `hints`, interaction with `mediation`.

## Why not update the field on interception?

The interceptors forward `options` to the original API unchanged, so there is
nothing to update there. The only gap is the serializer, which is where the
capture must happen.

## Compatibility

- Older TypeScript `lib.dom.d.ts`: handled by the local cast — no need to bump
  `target`/`lib`.
- Browsers without `hints` support: `options.hints` is simply `undefined`; the
  serializer emits no key and the panel shows nothing extra. Existing behavior
  is preserved.
