# Isolated Submit E2E pilot

In GitHub Actions, select **Isolated E2E pilot → Run workflow**. The same job
runs for PRs changing Submit or this harness. No repository secrets are required.
The single entry point on the GitHub-hosted Ubuntu runner is:

```sh
./ci/e2e/run.sh
```

This is CI infrastructure; a developer workstation setup is not required.

## What the journey covers

1. Staff signs in through Keycloak and generates an initial account invitation.
2. The first administrator registers, accepts the terms, and invites a second
   administrator through the UI. Initial staff onboarding generates a link;
   the subsequent administrator invitation is the application's emailed flow.
3. Common processes the real email queue and renders the invitation. Playwright
   reads its link from the fake CHES inbox and registers the invited user.
4. The invited proponent creates a Management Plan, completes contact information,
   uploads consultation, main plan and supporting documents, and submits to EAO.
5. The test checks the rendered proponent confirmation and staff notification.
6. Staff opens the submission, performs the consultation check and plan review,
   and sends recommendations to the manager. Reloads verify saved decisions.

The pilot ends at staff recommendations; manager approval, update requests,
resubmissions, other package types, and permission matrices are later journeys.

## Services and isolation

- Real Submit web/API from the PR, with all migrations against fresh PostgreSQL.
- Real Keycloak with a committed synthetic realm and separate staff/admin/proponent
  accounts. Browser authorization-code login and API JWT verification remain active.
  Government IDIR/BCeID/BCSC federation itself is outside this pilot; Keycloak's
  local login is used when the hinted external provider is not configured.
- Real EPIC.document API, separate temporary database, and Moto S3 storage emulator.
- Real EPIC.common Submit email worker/templates, pointed at a fake CHES HTTP API.
  It captures rendered messages and rejects non-`example.test` recipients.
- A small Conditions HTTP fixture supplies one approved management-plan condition
  and no report obligations. A fixed EPIC.auth group lookup supplies a synthetic
  manager email recipient; authentication itself uses real Keycloak. Track-derived project/proponent prerequisites are
  synthetic seed records. Accounts, invitations, submissions and reviews are not seeded.

The runtime Docker network is internal: services cannot reach DEV, production,
real identity providers, or CHES. S3 IAM/signature enforcement and virus scanning
are outside this pilot; stored file bytes and upload/download calls are exercised. No ports are published. Common and Document
source commits are pinned in `versions.env`; infrastructure/browser versions are
pinned in the Dockerfiles and Compose file. Update the Playwright image together
with the version in `submit-web/package-lock.json`.

All credentials in this directory are disposable test credentials. The S3 emulator uses a
fresh two-day self-signed certificate. Browser certificate errors are ignored only
inside this isolated test context; the Document API trusts that specific certificate.
The browser permits the private HTTP web origin as a secure context for OIDC PKCE.

## Failures and maintenance

One worker, no retries, and a new Compose project/database per job keep the first
journey deterministic. The seed refuses reuse of its project. Unknown fake-service
routes fail with 404 instead of returning generic success. No browser API mocks,
login token injection, or production test-mode authentication are used.

The script preserves its failure exit code, captures Compose logs and fake emails,
and tears down containers/networks/volumes on exit. GitHub uploads these alongside
Playwright's HTML report, failure traces, screenshots and video, including on failure.
Artifacts contain only synthetic data and expire after seven days.

Keep future journeys in `submit-web/playwright/isolated`. Do not add the legacy
DEV-connected specs to this config. Before adding parallel workers, allocate unique
accounts/projects per worker; the pilot deliberately has one shared scenario.
