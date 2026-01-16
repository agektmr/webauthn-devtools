# InfoLink Enhancements - Requirements

## Problem
Several WebAuthn concepts lacked documentation links in the DevTools panel:
1. Signal APIs (`signalUnknownCredential`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`) and `getClientCapabilities` method values needed InfoLinks
2. Client hints (`hints` parameter) had no documentation link
3. Existing descriptions for `userVerification` and `discoverableCredentials` described the linked content rather than the feature itself
4. `mediation:conditional` has different meanings for `credentials.get` vs `credentials.create`

## Goals
1. Add InfoLink for method values in static method calls
2. Add InfoLink for `hints` parameter
3. Fix descriptions to describe features, not documentation content
4. Support method-specific documentation for `mediation:conditional`

## Acceptance Criteria
- [x] Signal API and getClientCapabilities method values show InfoLink icon
- [x] `hints` parameter shows InfoLink with documentation
- [x] `userVerification` description describes the feature itself
- [x] `discoverableCredentials` description describes the feature itself
- [x] `mediation:conditional` shows different documentation based on whether it's a `get` or `create` call
