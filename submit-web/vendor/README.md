# Temporary theme release candidate

`epic.theme-2.0.0.tgz` is the built Material v9 theme from the paired `EPIC.common` migration. This is the exact installable package, not a second theme implementation. The metadata file records its integrity and source provenance.

The registry currently has only the v1 releases. This machine has no npm publishing authentication, so Submit temporarily installs this immutable local tarball to keep clean checkouts, CI and review builds reproducible. Nothing has been published. `latest` remains `1.0.11`; Compliance needs no change.

After the theme maintainer publishes the validated package under **mui9**:

1. Compare `npm view epic.theme@2.0.0 dist.integrity` with this metadata. If they differ, verify the new artifact and repeat the integration checks before adoption.
2. Run `npm install --save-exact epic.theme@2.0.0` from `submit-web`.
3. Remove this temporary vendor directory and commit the manifest/lockfile changes together.
4. Run `npm ci`, lint, unit tests, build and `npm run test:ui-contracts` again.

Do not publish v2 to `latest`, change Compliance, or use `--legacy-peer-deps` to bypass a release mismatch. Keep production promotion pending registry adoption and the authenticated workflow checks described in `docs/context/mui9-migration.md`.
