# Design: Add `topOrigin` Parameter

## Affected files

- `src/shared/types.ts` — extend `ParsedClientData` with `topOrigin?: string`.
- `src/parsers/client-data.ts` — read `topOrigin` from the decoded JSON and
  return it in the result.
- `PDD.md` — update the documented shape of `ParsedClientData` to match.

## Approach

`clientDataJSON` is a JSON object, so adding the field is a one-line
extension of both the JSON-cast shape and the returned object. The
existing `JsonView` component in `CallDetail.tsx` renders whatever keys
are present on the parsed client data, so no UI changes are required.

## Not changing

- UI components (rendering is key-driven).
- Tests: existing fixtures for `SAMPLE_CLIENT_DATA_JSON_CREATE` / `_GET`
  do not include `topOrigin`, so behavior for existing fixtures is
  unchanged (the parser returns `undefined` for missing field).
