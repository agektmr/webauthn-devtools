# Requirement - Add InfoLink Tooltips for WebAuthn Concepts

## Problem
WebAuthn concepts and properties (like `mediation`, `aaguid`, `userVerification`, etc.) can be complex for developers to understand. There was no easy way within the DevTools to access documentation or explanations for these items.

## Goals
- Provide inline documentation links for key WebAuthn concepts.
- Use a consistent UI element (info icon ⓘ) that shows a tooltip on hover.
- Tooltips should contain a brief description and a "Learn more" link to external documentation.
- The following properties and methods should be documented:
    - `userVerification`, `discoverableCredentials`, `allowCredentials`, `residentKey`, `requireResidentKey`, `excludeCredentials`
    - `aaguid`
    - `signalUnknownCredential`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`
    - `getClientCapabilities`
    - `mediation:conditional`
