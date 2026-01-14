# Separate Mediation Display

## Summary

Fix the display of request options in the WebAuthn DevTools panel so that `mediation` is shown separately from PublicKeyCredential options, reflecting the actual API structure.

## Problem

The `mediation` option was displayed along with PublicKeyCredentialCreationOptions/PublicKeyCredentialRequestOptions, but in the actual WebAuthn API, `mediation` is passed at the CredentialRequestOptions level, not inside the `publicKey` options.

API structure:
```javascript
navigator.credentials.get({
  publicKey: PublicKeyCredentialRequestOptions, // rpId, challenge, allowCredentials, etc.
  mediation: 'conditional'  // Separate from publicKey
});
```

## Requirements

1. Display `mediation` separately from publicKey options
2. Show PublicKeyCredentialCreationOptions or PublicKeyCredentialRequestOptions with their proper type names
3. Show CredentialRequestOptions section when mediation is present
