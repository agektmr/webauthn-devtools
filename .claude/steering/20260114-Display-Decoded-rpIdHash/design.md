# Design: Display Decoded rpIdHash

## Approach

Since SHA-256 is a one-way hash, we cannot directly decode `rpIdHash`. However, the `clientData` contains the `origin` field which includes the RP ID. By extracting the hostname from the origin and computing its SHA-256 hash, we can verify it matches the `rpIdHash` and display the decoded value.

## Implementation

### New Component: `RpIdHashDisplay`

Located in `src/devtools/panel/components/CallDetail.tsx`

**Props:**
- `rpIdHash: string` - The hex-encoded SHA-256 hash
- `origin?: string` - The origin from clientData (optional)

**Logic:**
1. Extract hostname from origin using `URL.hostname`
2. Compute SHA-256 of hostname using Web Crypto API
3. Compare computed hash with `rpIdHash`
4. Display decoded hostname only if hashes match

### Helper Functions

```typescript
async function computeRpIdHash(rpId: string): Promise<string>
function extractRpIdFromOrigin(origin: string): string
```

### Styling

New CSS classes in `src/devtools/panel/index.css`:
- `.rpid-hash-display` - Flexbox container matching `.aaguid-display`
- `.rpid-decoded` - Blue pill-style badge showing the decoded hostname

## Files Modified

1. `src/devtools/panel/components/CallDetail.tsx` - Added `RpIdHashDisplay` component
2. `src/devtools/panel/index.css` - Added styling for `.rpid-hash-display` and `.rpid-decoded`
