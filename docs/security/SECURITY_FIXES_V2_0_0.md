# EPIC.submit — v2.0.0 security fixes

**Prepared:** 28 October 2026
**Branch:** `fix/security-v2.0.0`
**Exact base:** tag `v2.0.0`, commit `36bea19a78fcd152237b3901c87d19f491af9f38`
**Scope:** security patch prepared for release review. No deployment or production data changes are included.

## Business summary

This patch closes the reviewed anonymous invitation-discovery path, binds invitation acceptance to the signed-in identity, and prevents users and administrators from changing users or assigning projects outside their company. It also restricts private account information, package history, and map-upload operations to authorized resources.

The changes reuse existing permissions and services. There are no database migrations or dependency-version changes. The API and frontend must be released together because registration now uses an invitation-specific company lookup. This is a targeted remediation, not a claim that every possible vulnerability has been eliminated or that production was never affected.

## Changes and impact

| Finding | Implemented change | Effect on legitimate users |
|---|---|---|
| C1 / H5: invitation disclosure and arbitrary identity acceptance | Proponent list/detail require staff read access. General invitation serialization omits tokens; staff with `EAO_CREATE` or `FULL_ACCESS` can still copy links. Acceptance requires authentication and replaces body `auth_guid` with the validated identity. Invitation administration checks staff create permission; corrected a decorator mistakenly used as a boolean permission check. | Staff invitation sharing and authenticated onboarding remain supported. Public registration receives only the invited company name and selected work details. Intended-recipient verification remains a separate item below. |
| C2: account creation / project association | Both POST endpoints require `EAO_CREATE` or `FULL_ACCESS`. Bulk association verifies every project belongs to the account's proponent. | Normal UI onboarding uses invitations, not these direct POST hooks. The pre-existing broken constant in direct account creation is not repaired or silently enabled. |
| C3: role/status changes across companies | Validate target account, every assigned project, and every supplied package before replacing roles. Project admins must administer all affected projects, including historical roles that could be reactivated; they cannot reactivate a former primary administrator. | Same-company authorized administration remains available. Multi-project users may need an account primary administrator to change their access. |
| C4: arbitrary profile and account reassignment | Profile PATCH is self-only and uses a dedicated contact-field allowlist. Reject `id`, `user_id`, `account_id`, role and consent fields. | The current profile UI edits the signed-in user and sends permitted contact fields. |
| H1: private metadata without authentication | Authenticate proponent/project lookups, activity history and package-version history. Check resource ownership for history; exclude staff-only log entries from proponent responses. | Public active-banner behavior is unchanged. Registration's dependency on proponent details is replaced with the scoped invitation endpoint. |
| H2: unscoped account/user data and consent | Account/user/history reads require matching account membership or explicit staff access. `all_users=true` still requires account access. Consent changes must concern the signed-in identity. | Same-company submission contact selection continues to use `all_users=true`. |
| H3: map upload object access — partial | Require an authorized item/package for listing; resolve upload keys through submitted documents before status, read-link, approve, retry and direct-create operations. Hide unexpected read-link error details. | Authorized proponent map confirmation remains available. Unattached uploads and keys shared with inaccessible packages are denied. Storage-key provenance is not fully solved; see below. |
| M1: missing user causes server error | Missing users in the reviewed authorization helpers produce a controlled authorization response. | Unprovisioned users cannot enter protected project/package operations; invitation onboarding remains supported. |
| M2: maintenance SQL hardening | Bind identity values as SQL parameters and quote metadata-derived identifiers. | Maintenance behavior and access requirements remain the same. The earlier review did not demonstrate SQL injection. |
| M4: non-production error handling | Unexpected errors are re-raised only in debug/testing; ordinary HTTP errors retain their status. | Staging with debug disabled receives generic unexpected-error responses. |
| M5: project count disclosure | Apply proponent account and role restrictions before pagination/counting. Apply computed-status filtering before slicing status-filtered results. | Counts reflect authorized projects; status-filtered pages are consistent. Status filtering loads the authorized matching set before slicing, so large-account performance should be checked. |
| L1: PR title shell injection | Pass the PR title through an environment variable instead of inserting it into shell source. | Jira-title validation behavior remains the same. |

## UI compatibility checked

- **Registration:** the two company-detail consumers now use `GET /invitations/{token}/proponent`. The existing acceptance request already sends a login token.
- **Staff link sharing:** preserved for invitation managers; a read-only response without a token cannot produce or copy an `undefined` link.
- **Profile editing:** the route supplies the current user's preferred username; its contact fields are allowed.
- **Submission contacts:** retained account-wide contact lookup within the caller's company.
- **Maps:** existing UI lists pass an item/package. No active component calls the direct `useCreateGeoUpload` hook; normal submission processing remains the upload-creation path.
- **Direct provisioning:** `useCreateAccount` / bulk-add hooks have no active UI call sites in this tag.

## Remaining work / deliberate limitations

| Item | What remains and why |
|---|---|
| Invitation recipient binding (C1/H5) | Invitations remain bearer links: a different authenticated person holding a valid link can redeem it as themselves. Some staff-created links intentionally have no recipient email. Enforcing a specific recipient requires a business decision and a verified recipient/identity workflow, rather than trusting a client-supplied work email. Previously exposed pending invitations should be reviewed and reissued after rollout. |
| Storage ownership (H3) | The new checks use existing submission-document associations, but those associations are not cryptographic proof that a storage key was issued to that user. Full closure needs document-service-issued upload ownership/provenance and validation when attaching a document; this likely spans services and persisted metadata. |
| Broad staff scope (H4) | Invitation administration is tightened, but the general staff project helper still permits staff before enforcing project/work assignment. A complete fix requires an agreed operation-by-operation staff permission matrix and coordinated enforcement across callers. Existing downstream package controls must be preserved. |
| Secret/CSP hardening (M3) | No production default-secret exploit was established. Runtime secret provisioning and stricter CSP on the actual web HTML need deployment configuration and script/style compatibility testing; they are outside this code-only patch. |
| Legacy direct account creation | `AccountService.create_account` still references the pre-existing nonexistent `RoleModel.ACCOUNT_PRIMARY_ADMIN`. The endpoint is now staff-only. Repairing or retiring this unused flow is separate from preserving working invitation onboarding. |
| L2 | Informational finding; no application code change required. |
| Existing inconsistent records | The patch does not remove previously created cross-company memberships, project links, or suspicious users. Review historical data and logs separately. |

## Validation

- **55 isolated API security regression tests passed.** Includes positive authorized flows and negative anonymous/cross-company cases, JWT identity binding, protected fields, staff invitation permissions, pagination restrictions, map ownership checks and parameterized SQL.
- **23 focused frontend tests passed**, including two new tests for invitation-scoped onboarding plus existing account-user and registration tests.
- **Frontend production build passed** (`tsc && vite build`); subsequent TypeScript check passed after adding tests.
- **Full existing frontend suite:** 273 passed / 4 failed. An untouched v2.0.0 snapshot with the same dependencies reproduced the identical four failures in `sanitizeBannerHtml.test.ts` under the repository's `happy-dom` environment. All nine tests in that file pass under `jsdom`. This indicates a test-environment discrepancy; it does not establish a production XSS exploit or replace browser validation.
- Changed Python files passed `pyflakes`; `git diff --check` passed.
- Python application dependencies installed in an isolated Python 3.12 environment. The repository's combined development requirements conflict (`pycodestyle==2.14.0` vs flake8 7.1.1's `<2.13.0` requirement); no dependency pins were changed.
- API tests mock persistence/external services. They intentionally bypass the repository's database-dropping test fixture. No production database, identity provider, email or storage operations were executed. Full database-backed and browser end-to-end validation remains a staging release requirement.

### Reproduce focused checks

From `submit-api/`, with application dependencies and pytest installed:

```sh
PYTHONPATH=src python -m pytest --confcutdir=tests/security tests/security -o addopts='' -q
```

From `submit-web/` after installing locked dependencies:

```sh
npm run build
npx vitest run src/hooks/api/useInvitations.security.test.ts src/hooks/api/useAccountUsers.test.ts src/routes/proponent/account-registration/create-account.test.tsx src/components/App/AccountRegistration/ContactInformationForm.test.tsx
```

## Before release

Deploy API and web together. In staging, exercise staff invitation creation/copy/renewal; new and existing-account registration; own-profile and consent updates; account/project-admin role and status changes; submission contacts; project pagination; package history; and proponent/staff map preview, confirmation and retry. Use two distinct companies to verify cross-company requests are rejected. Check old unattached map records and multi-project user-management cases for expected denials. Review and repair suspicious historical access separately; deploying this patch does not prove that no earlier misuse occurred.
