# Fix Abbreviated Method Names

## Summary

Fix the display of WebAuthn static method names in the left pane and filter dropdown to show full method names instead of abbreviations.

## Problem

Method names were displayed using abbreviations that may not be immediately recognizable:
- `isUVPAA()` instead of `isUserVerifyingPlatformAuthenticatorAvailable()`
- `isCMA()` instead of `isConditionalMediationAvailable()`

## Requirements

1. Display full method names in the call list (left pane)
2. Display full method names in the filter dropdown
3. Maintain consistency across all UI elements
