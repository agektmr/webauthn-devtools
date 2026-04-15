# Add `hints` Parameter Support - Task List

- [x] Add `hints?: string[]` to `CreateRequest` in `src/shared/types.ts`.
- [x] Add `hints?: string[]` to `GetRequest` in `src/shared/types.ts`.
- [x] Serialize `hints` in `serializeCreateRequest`
      (`src/injected/serializer.ts`).
- [x] Serialize `hints` in `serializeGetRequest`
      (`src/injected/serializer.ts`).
- [x] Add unit tests for `hints` in both serializers
      (`tests/unit/serializer.test.ts`).
- [x] Verify Chrome build succeeds (`npm run build:chrome`).
- [x] Verify unit tests pass (`npm run test`).
- [x] Confirm `JsonView` automatically shows the `hints` InfoLink via existing
      `DOC_LINKS['hints']` mapping.
