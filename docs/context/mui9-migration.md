# Submit Material UI migration handoff

## Scope and compatibility boundary

Submit moves to Material UI and icons 9.5.0, MUI X Date Pickers 9.16.0, and epic.theme 2.0.0. React and React DOM remain 18.3.1; react-is is aligned to React. CI and the frontend container use Node 24; local Node/npm versions are not restricted by the project.

The release PR branch `mui-upgrade-release-v2.1.0` was created directly from `origin/release/v2.1.0` at `b285267e`. The two migration commits were cherry-picked onto it; no develop branch history was merged. Release-specific rejected-document protections, review notices, optional-item labels and future-date restrictions were retained while updating MUI APIs. Existing working copies were preserved.

Paired Common implementation: `41416e6`, followed by `a3c1bb0` removing local Node/npm restrictions, on `mui-upgrade`.

Compliance requires no code, dependency, or deployment change. Its `^1.0.11` range excludes theme 2. The theme publication workflow keeps the legacy `latest` channel unchanged and publishes v2 only under `mui9` (prereleases under `mui9-next`). Do not promote v2 to `latest` while existing consumers depend on that channel.

## Implementation

- Theme: explicit Material 9 peers, externalized framework dependencies, ESM/types/CSS exports, bundled fonts, preserved public theme API and shallow merge behavior, visible keyboard focus, updated multiline styling, clean consumer package checks, and guarded version-tag publication.
- Submit: Grid sizing, system props, slots, removed APIs and icon imports migrated. Shared React Hook Form adapters preserve values, masks, refs, blur handlers, validation and focus with the accessible segmented date fields.
- Interactive accordion actions sit outside summary buttons. Dialogs have accessible names; terms acceptance still requires scrolling and cannot be bypassed with Escape or backdrop clicks.
- TypeScript 5 and explicit project checks expose existing stale types. Repairs include optional data guards, accurate model/fixture types, obsolete component props and mutation arguments. Role and permission semantics are preserved.
- CI now fails on lint, unit or production build failures and runs Chromium/WebKit shared-control checks. Browser fixtures are separate from the shipped app routes.

The migration was checked incrementally through Material 6, Material 7, Pickers 8, Pickers 9 and Material 9. These checkpoints are validation history, not separately published releases. No percentage performance improvement is claimed; measure real production workflows before making that claim.

## Reproduce validation

Node 24 remains the CI default; the project does not enforce a local Node/npm version. In `EPIC.common/epic.theme`, run `npm ci`, `npm test`, `npm run build`, and `npm run test:package`. The last command installs the actual tarball into a disposable consumer and checks types, theme augmentation, bundling and framework dependency resolution.

In `EPIC.submit/submit-web`, run `npm ci`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run typecheck:ui-contracts`, `npx playwright install --with-deps chromium webkit`, and `npm run test:ui-contracts`.

The browser suite exercises actual shared components with local data: masks, selects, dates and bounds, native form refs, error focus, multiline input, accordion actions, dialogs, terms gating, fonts, keyboard focus, accessibility and narrow layouts. It does not replace authenticated staff/proponent end-to-end testing.

Candidate validation: clean installs succeeded for both projects; Submit lint and UI fixture type checks passed; 291 unit tests across 35 files passed; all 28 Chromium/WebKit checks passed; all 6 theme tests and the clean packed-consumer check passed. Desktop/mobile fixture screenshots were reviewed. Accessibility checks found no serious or critical violations in the fixture, which is narrower than a whole-application accessibility audit.

The final Submit production type checks and build passed. Vite reports large JavaScript chunks (main about 1.95 MB before gzip); performance optimization remains separate work and requires a measured baseline. Framework dependency resolution passes without invalid peer dependencies.

## Release sequence and remaining gates

1. Review both branches and configure the Common workflow's protected `npm` environment and npm token. Theme publication and deployment have not been performed.
2. Publish the reviewed theme artifact using the matching `epic-theme-v2.0.0` tag and `mui9` channel. Verify `latest` still points to 1.0.11 and inspect artifact integrity.
3. Submit currently uses `file:vendor/epic.theme-2.0.0.tgz` because publishing credentials were unavailable. This portable exact package makes clean builds reproducible. Its adjacent JSON records integrity and source provenance. Follow `submit-web/vendor/README.md` to replace it with exact registry version `2.0.0`, remove the temporary vendor directory, and repeat validation. If published integrity differs, inspect the artifact and rerun integration checks.
4. In a test environment, verify real staff and proponent workflows: project/package navigation, create/edit/save/reload, document upload and preview, update/revision requests, accept/reject permissions, filtering and date boundaries, terms persistence, and keyboard navigation. Include backend failures and expired sessions. Confirm API payloads and saved dates remain correct.
5. Build the production container and validate the deployed candidate with real API/auth configuration. Review desktop/mobile visual changes and measure representative workflow performance against the existing deployment. Promote only after these gates pass.

## Rollback

Roll back the Submit deployment to its previous immutable image and restore its prior manifest/lockfile together if reverting source. Keep theme 1.0.11 and its legacy channel available. Publishing theme 2 does not require rolling Compliance forward or backward. Do not unpublish packages or overwrite registry versions as rollback steps.

## Local runtime validation

Project-owned engine ranges and `engine-strict` configuration were removed from Submit and the theme. Node 24 remains the optional `.nvmrc` selection and the CI/container default; developers can use Node 25 without a project-imposed upper bound. Dependency packages retain their own engine requirements.

Node 25.8.1 with npm 11.11.0 passed theme tests/build and the clean packed-consumer check, and Submit lint, all 291 unit tests, production type checks/build and UI fixture type checks. A final clean install of the refreshed tarball had no engine warnings, and all 28 Chromium/WebKit checks passed on Node 25.

## Release branch integration

The release-based candidate passed lint, all 430 unit tests in 61 files, and all 28 Chromium/WebKit checks on Node 25.8.1. Release modal tests now exercise accessible date sections. A regression test covers preservation of rich helper text and error precedence. Rejected-document guards and release-only review behavior were retained.

The PR remains draft until Common PR https://github.com/bcgov/EPIC.common/pull/56 is released as theme 2.0.0 and Submit adopts the registry package with a verified lockfile. Authenticated environment checks remain required before production.
