# Design: Separate Mediation Display

## Approach

Modify the `RequestView` component to:
1. Extract `mediation` from the request object
2. Display publicKey options in their own section with the proper type name
3. Display mediation in a separate CredentialRequestOptions section

## Implementation

### Modified Component: `RequestView`

File: `src/devtools/panel/components/CallDetail.tsx`

```typescript
function RequestView({ call }: { call: WebAuthnCall }): React.ReactElement {
  const request = call.request as unknown as Record<string, unknown>;
  const mediation = request.mediation as string | undefined;

  // Create a copy without mediation
  const publicKeyOptions = { ...request };
  delete publicKeyOptions.mediation;

  return (
    <>
      {/* PublicKeyCredential{Creation|Request}Options section */}
      {hasPublicKeyOptions && (
        <div className="section">
          <div className="section-title">
            {call.type === 'create' ? 'PublicKeyCredentialCreationOptions' : 'PublicKeyCredentialRequestOptions'}
          </div>
          <JsonView data={publicKeyOptions} />
        </div>
      )}

      {/* CredentialRequestOptions section */}
      {mediation && (
        <div className="section">
          <div className="section-title">CredentialRequestOptions</div>
          <div className="response-tree">
            <div className="json-property">
              <span className="json-key">mediation:</span>
              {mediation === 'conditional' && <InfoLink docKey="mediation:conditional" />}
              <span className="json-value string">"{mediation}"</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

## Files Modified

1. `src/devtools/panel/components/CallDetail.tsx` - Updated `RequestView` component
