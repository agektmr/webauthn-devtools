# InfoLink Enhancements - Task List

## Completed Tasks

### Method Value InfoLinks
- [x] Modify `JsonView.tsx` to detect `method` key with documented value
- [x] Add InfoLink after method value when documentation exists

### Client Hints
- [x] Add `hints` entry to `DOC_LINKS` in `docLinks.ts`
- [x] Link to https://passkeys.dev/docs/advanced/client-hints/

### Description Improvements
- [x] Update `userVerification` description to describe the feature
- [x] Update `discoverableCredentials` description to describe the feature

### Method-Specific Mediation
- [x] Replace `mediation:conditional` with `mediation:conditional:get` and `mediation:conditional:create`
- [x] Update `CallDetail.tsx` to use `mediation:conditional:${call.type}` pattern
- [x] Set appropriate URLs for each method type

## Documentation Links Added/Modified

| Key | URL |
|-----|-----|
| `hints` | https://passkeys.dev/docs/advanced/client-hints/ |
| `mediation:conditional:get` | https://web.dev/articles/passkey-form-autofill |
| `mediation:conditional:create` | https://developer.chrome.com/docs/identity/webauthn-conditional-create |

## Pending
- [ ] Commit changes (pending user request)
