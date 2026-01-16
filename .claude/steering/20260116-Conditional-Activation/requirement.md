# Conditional Activation - Requirements

## Problem
The extension was injecting WebAuthn API interceptors into ALL pages immediately at `document_start`, regardless of whether the DevTools panel was open. This caused:
- Every page to have its WebAuthn APIs wrapped
- Console showing "WebAuthn DevTools interceptors installed" on every page
- Unnecessary overhead when not actively debugging

## Goal
Only inject the WebAuthn interceptors when the DevTools panel is actually open for that tab.

## Acceptance Criteria
- [x] Extension does not inject interceptors until panel is opened
- [x] When panel opens, interceptors are injected into the current page
- [x] When page navigates while panel is open, interceptors are re-injected
- [x] Documentation updated to reflect the new behavior

## Trade-offs Accepted
- If user opens DevTools after WebAuthn calls have occurred, those calls will be missed
- User must reload the page to capture subsequent calls in this scenario
