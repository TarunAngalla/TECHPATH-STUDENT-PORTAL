# Phase 3 Validation — NDA Signing and Portal Activation

## Implemented

- Admin-only `/admin/nda` page for creating immutable NDA versions, activating one effective version, viewing pending candidates, and downloading signed copies.
- Candidate `/nda` gate that displays the active agreement and requires exact typed legal-name matching plus explicit consent.
- Replaceable `NdaSigningProvider` contract with the `typed_name_v1` implementation.
- Agreement claim/finalize state machine (`pending → signing → signed`) with stale-signing recovery and transaction-safe finalization.
- Database trigger prevents mutation of finalized signature evidence while still allowing status supersession/reactivation and email-delivery timestamps.
- Active-template integrity verification using a deterministic SHA-256 hash.
- Signature evidence including candidate identity, signer name, consent text, timestamp, IP address, user agent, provider, template hash, and signed-document hash.
- Generated signed PDF evidence, attempt-unique hash-addressed private Supabase object storage, candidate/admin authorized signed downloads, and candidate email attachment.
- Signed-agreement email delivery tracking linked to the candidate and NDA agreement.
- New-version activation supersedes prior versions for access purposes, recalculates eligible candidate account states, and invalidates stale candidate sessions.
- Central access evaluator requires a signed agreement for the currently active NDA before returning `PORTAL_ACTIVE`.
- Admin dashboard NDA-pending metric and admin-only NDA navigation.
- Migration `0004_nda_signing_activation.sql`, migration smoke assertions, and `npm run nda:smoke`.

## Local patch-build validation

- `npm run typecheck`: PASS
- `npm run lint`: PASS with the pre-existing `Avatar.tsx` image warning only
- `npm run build`: PASS using temporary non-secret build environment values
- `npm run nda:smoke`: PASS
- Generated PDF parsed successfully as a valid PDF during patch construction
- `npm run db:smoke`: must be rerun by Cursor against the configured PostgreSQL development instance

## Required target-environment verification

1. Apply all migrations to a backed-up development database and run `npm run db:smoke`.
2. Configure a private Supabase documents bucket and verify no signed NDA object has public access.
3. Create and activate a client-approved test NDA from `/admin/nda`.
4. Complete secure account setup for a candidate and confirm the candidate enters `nda_pending`.
5. Confirm direct candidate portal URLs redirect to `/nda`.
6. Submit without consent, with a mismatched name, and with a valid exact name; verify only the valid request signs.
7. Confirm the agreement is `signed`, the candidate account becomes `active`, `session_version` increments, and the current session reaches `/dashboard`.
8. Confirm the PDF hash/path and signature evidence are stored and the PDF can be opened.
9. Confirm the owning candidate and admin can download the signed PDF; recruiter, another candidate, and unauthenticated users are denied.
10. Confirm a repeated/double submission cannot create a second agreement or overwrite/delete the finalized PDF.
11. Activate a second NDA version and confirm prior agreements become `superseded`, candidate sessions are invalidated, and unsigned candidates are gated again.
12. Reactivate a previously signed version and confirm candidates who signed that exact version return to active while others remain pending.
13. Confirm signed-NDA email delivery is logged; when Resend is configured, confirm the PDF attachment and authenticated portal download link.
14. Confirm suspended and pending-setup candidates cannot sign or bypass their earlier access states.

## Production release blocker

The implementation uses typed-name acceptance as the MVP signing method. The client/legal team must approve the final agreement text and confirm that this evidence model is acceptable for production. Until then, use it only for development/UAT or replace the provider with an approved external e-signature adapter.
