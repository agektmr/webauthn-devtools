# InfoLink Enhancements - Design

## 1. Method Value InfoLinks

### Problem
The `JsonView` component only added InfoLinks for property **keys**, not property **values**. For static method calls, the method name (e.g., `signalUnknownCredential`) is the value of the `method` property, not a key.

### Solution
Modified `JsonObject` in `JsonView.tsx` to check if:
1. The key is `"method"`
2. The value is a string
3. That string has a doc link

If all conditions are met, an InfoLink is rendered after the value.

```tsx
const isMethodWithDocLink =
  key === 'method' &&
  typeof val === 'string' &&
  hasDocLink(val);

// In render:
{isMethodWithDocLink && <InfoLink docKey={val as string} />}
```

## 2. Client Hints

Added new entry to `DOC_LINKS`:

```typescript
hints: {
  label: 'Client Hints',
  description: 'Request a specific credential manager or passkey selection experience.',
  url: 'https://passkeys.dev/docs/advanced/client-hints/',
},
```

This automatically gets picked up by `JsonView` since it checks `hasDocLink(key)` for all property keys.

## 3. Description Improvements

Changed descriptions from "Learn about..." style to feature descriptions:

| Key | Before | After |
|-----|--------|-------|
| `userVerification` | "Understand UV requirements..." | "Configure whether the authenticator must verify user identity via PIN, biometric, or other method." |
| `discoverableCredentials` | "Learn about passkeys..." | "Configure whether credentials stored on the authenticator can be discoverable without providing credential IDs." |

## 4. Method-Specific Mediation Documentation

### Problem
`mediation: "conditional"` serves different purposes:
- In `credentials.get()`: Enables passkey autofill in login forms
- In `credentials.create()`: Enables automatic/conditional passkey creation

### Solution
Replaced single `mediation:conditional` key with method-specific keys:

```typescript
'mediation:conditional:get': {
  label: 'Conditional UI',
  description: 'Enable passkey autofill suggestions in login forms.',
  url: 'https://web.dev/articles/passkey-form-autofill',
},
'mediation:conditional:create': {
  label: 'Conditional Create',
  description: 'Create a passkey automatically and conditionally.',
  url: 'https://developer.chrome.com/docs/identity/webauthn-conditional-create',
},
```

Updated `CallDetail.tsx` to use dynamic key:
```tsx
<InfoLink docKey={`mediation:conditional:${call.type}`} />
```

## Files Modified

| File | Change |
|------|--------|
| `src/devtools/panel/components/JsonView.tsx` | Add InfoLink for method values |
| `src/devtools/panel/utils/docLinks.ts` | Add `hints`, update descriptions, split `mediation:conditional` |
| `src/devtools/panel/components/CallDetail.tsx` | Use method-specific mediation doc key |
