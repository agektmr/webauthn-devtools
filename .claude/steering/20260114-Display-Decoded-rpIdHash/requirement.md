# Display Decoded rpIdHash

## Summary

Enhance the WebAuthn DevTools panel to display the decoded RP ID (hostname) alongside the `rpIdHash` value, making it easier for developers to identify which relying party a credential belongs to.

## Problem

The `rpIdHash` is a SHA-256 hash of the Relying Party ID, displayed as a hex string. Developers need to manually compute the hash to verify which domain a credential is associated with.

## Requirements

1. Display the RP ID hostname next to the rpIdHash value
2. Verify the decoded RP ID by computing SHA-256 and matching against the displayed hash
3. Only show the decoded value if verification succeeds
4. Apply consistent styling with other annotated fields (like AAGUID)
