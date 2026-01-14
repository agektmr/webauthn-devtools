# Design: Fix Abbreviated Method Names

## Approach

Update the formatting functions and UI components to display full method names instead of abbreviations.

## Files Modified

### 1. `src/devtools/panel/utils/formatters.ts`

Updated `formatCallType()` function:
```typescript
case 'isUserVerifyingPlatformAuthenticatorAvailable':
  return 'isUserVerifyingPlatformAuthenticatorAvailable()';
case 'isConditionalMediationAvailable':
  return 'isConditionalMediationAvailable()';
```

### 2. `src/devtools/panel/components/FilterBar.tsx`

Updated filter dropdown options:
```tsx
<option value="isUserVerifyingPlatformAuthenticatorAvailable">
  isUserVerifyingPlatformAuthenticatorAvailable()
</option>
<option value="isConditionalMediationAvailable">
  isConditionalMediationAvailable()
</option>
```
