# E2E Test Expansion: Ephemeral OpenShift Environments - Complete Implementation Plan

**Created**: December 2024
**Status**: Planning Complete - Ready for Implementation
**Task**: SUBMIT-task#695

## Executive Summary

This document outlines the complete plan for expanding EPIC.submit E2E tests from login-only coverage to full CRUD operations using ephemeral OpenShift environments. The approach deploys isolated test environments in the DEV namespace using Helm charts, enabling true end-to-end testing without data pollution.

## Background Context

### Current State
- **E2E Framework**: Playwright (migrated from Cypress)
- **Current Coverage**: Login flows only (ROPC, BCSC UI, BCeID UI)
- **Test Environment**: Shared DEV environment (https://dev.submit.eao.gov.bc.ca)
- **Database State**: No cleanup - data persists indefinitely in DEV database
- **Problem**: Cannot test CRUD operations without data isolation

### Application Architecture
- **Frontend**: React 18.2 + TypeScript + Material-UI + Vite
- **Backend**: Flask (Python) REST API with PostgreSQL
- **Deployment**: OpenShift/Kubernetes with Helm charts
- **Authentication**: Keycloak OIDC
- **CI/CD**: GitHub Actions

### Key Discovery: Complex Registration Flow
During exploration, we discovered the proponent registration is invitation-based:
- Requires admin-created invitation token
- Multi-step UI flow (OIDC login → form → project assignment)
- Creates 5+ database records (users, accounts, account_users, account_projects, user_roles)
- Async email delivery via cron job
- **Decision**: Test this flow as the first E2E test (validates real user journey)

---

## Problem Statement

Need to expand E2E test coverage to CRUD operations, which requires:
- **Data isolation** between test runs
- **Clean database state** for each test
- **No interference** with DEV environment data
- **Production-like testing** environment

---

## Approved Solution

### Approach: Ephemeral Helm Deployments in DEV Namespace

Deploy ephemeral instances **within** the existing DEV namespace (c8b80a-dev):

**What Gets Deployed:**
- `submit-patroni-e2e-{run-id}` - Isolated PostgreSQL database
- `submit-api-e2e-{run-id}` - Backend Flask API
- `submit-web-e2e-{run-id}` - Frontend React SPA

**What Gets Reused:**
- DEV Keycloak (authentication)
- DEV Epic.Document (object storage)
- DEV Epic.Conditions (compliance library)

**Run ID Format**: `e2e-{short-sha}-{timestamp}` (e.g., `e2e-abc1234-1702345678`)

### Why This Approach?

✅ **Production-like**: Uses actual Helm charts and deployment configs
✅ **Leverages existing infrastructure**: Reuses DEV external services
✅ **True isolation**: Fresh database per test run
✅ **Tests real deployments**: Catches deployment configuration issues
✅ **Manageable**: Doesn't require full ecosystem deployment
✅ **CI only**: Local dev continues using DEV environment (no disruption)

### Key Architecture Decisions

1. **Minimal Seeding**: Seed only projects + invitation (not full user accounts)
2. **Test Registration First**: First test validates complete onboarding flow
3. **Realistic Test Data**: Use real BC project names (Coastal GasLink, Site C, LNG Canada)
4. **Guaranteed Cleanup**: `if: always()` step ensures resource removal even on failure

---

## Implementation Plan

### Phase 1: Helm Chart Parameterization

**Objective**: Make charts support unique release names for ephemeral deployments

#### 1.1 Update submit-api Helm Chart

**Files to modify:**

**deployment/charts/submit-api/templates/deployment.yaml**
- Line 5: Change `app: "{{ .Chart.Name }}"` → `app: "{{ .Release.Name }}"`
- Line 11: Change `app: {{ .Chart.Name }}` → `app: {{ .Release.Name }}`
- Line 20: Change `app: {{ .Chart.Name }}` → `app: {{ .Release.Name }}`

**deployment/charts/submit-api/templates/route.yaml**
- Line 5: Change `app: "{{ .Chart.Name }}"` → `app: "{{ .Release.Name }}"`
- Line 6: Change `name: "{{ .Chart.Name }}"` → `name: "{{ .Release.Name }}"`
- Line 8: Change `host: "{{ .Chart.Name }}-{{ .Release.Namespace }}.apps.gold.devops.gov.bc.ca"` → `host: "{{ .Release.Name }}-{{ .Release.Namespace }}.apps.gold.devops.gov.bc.ca"`
- Line 14: Change `name: "{{ .Chart.Name }}"` → `name: "{{ .Release.Name }}"`

**deployment/charts/submit-api/templates/service.yaml**
- Change `metadata.name` to `{{ .Release.Name }}`
- Change `spec.selector.app` to `{{ .Release.Name }}`

**deployment/charts/submit-api/templates/configmap.yaml**
- Change `metadata.name` to `{{ .Release.Name }}`

#### 1.2 Update submit-web Helm Chart

**deployment/charts/submit-web/templates/deployment.yaml**
- Change all `app: {{ .Values.app.name }}` → `app: {{ .Release.Name }}`
- Change `metadata.name` to `{{ .Release.Name }}`
- Change `spec.selector.matchLabels.app` to `{{ .Release.Name }}`

**deployment/charts/submit-web/templates/service.yaml**
- Change `metadata.name` to `{{ .Release.Name }}`
- Change `spec.selector.app` to `{{ .Release.Name }}`

**deployment/charts/submit-web/templates/configmap.yaml**
- Change `metadata.name` to `{{ .Release.Name }}`

#### 1.3 submit-patroni Chart

**No changes needed** - Already uses `.Release.Name` correctly via `patroni.fullname` helper template

---

### Phase 2: GitHub Actions Workflow

**File**: `.github/workflows/e2e.yml`

**Complete workflow** (replace existing file):

```yaml
name: E2E Tests (Ephemeral Environment)

on:
  workflow_dispatch:
  pull_request:
    paths:
      - 'submit-web/**'
      - 'submit-api/**'
      - '.github/workflows/e2e.yml'

env:
  NAMESPACE: c8b80a-dev
  TOOLS_NAMESPACE: c8b80a-tools
  IMAGE_TAG: dev

jobs:
  e2e-tests:
    runs-on: ubuntu-22.04
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Generate run ID
        id: id
        run: |
          RUN_ID="e2e-$(echo ${{ github.sha }} | cut -c1-7)-$(date +%s)"
          echo "RUN_ID=${RUN_ID}" >> $GITHUB_OUTPUT
          echo "RELEASE_PATRONI=submit-patroni-${RUN_ID}" >> $GITHUB_OUTPUT
          echo "RELEASE_API=submit-api-${RUN_ID}" >> $GITHUB_OUTPUT
          echo "RELEASE_WEB=submit-web-${RUN_ID}" >> $GITHUB_OUTPUT

      - name: Install OpenShift CLI
        run: |
          curl -LO https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/openshift-client-linux.tar.gz
          tar -xzvf openshift-client-linux.tar.gz
          sudo mv oc /usr/local/bin/
          oc version --client

      - name: Install Helm
        run: |
          curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
          helm version

      - name: Login to OpenShift
        run: |
          oc login --token=${{ secrets.OPENSHIFT_SA_TOKEN }} --server=https://api.gold.devops.gov.bc.ca:6443
          oc project ${{ env.NAMESPACE }}

      - name: Deploy Ephemeral Database
        run: |
          helm install ${{ steps.id.outputs.RELEASE_PATRONI }} \
            ./deployment/charts/submit-patroni \
            --namespace ${{ env.NAMESPACE }} \
            --set replicaCount=1 \
            --set persistentVolume.size=256Mi \
            --wait --timeout 5m

      - name: Deploy Ephemeral API
        run: |
          helm install ${{ steps.id.outputs.RELEASE_API }} \
            ./deployment/charts/submit-api \
            --namespace ${{ env.NAMESPACE }} \
            --set image.tag=${{ env.IMAGE_TAG }} \
            --set database.secret=${{ steps.id.outputs.RELEASE_PATRONI }} \
            --set database.service.name=${{ steps.id.outputs.RELEASE_PATRONI }} \
            --set cors.origin="https://${{ steps.id.outputs.RELEASE_WEB }}-${{ env.NAMESPACE }}.apps.gold.devops.gov.bc.ca," \
            --wait --timeout 5m

      - name: Deploy Ephemeral Web
        run: |
          helm install ${{ steps.id.outputs.RELEASE_WEB }} \
            ./deployment/charts/submit-web \
            --namespace ${{ env.NAMESPACE }} \
            --set image.tag=${{ env.IMAGE_TAG }} \
            --set app.url="${{ steps.id.outputs.RELEASE_WEB }}-${{ env.NAMESPACE }}.apps.gold.devops.gov.bc.ca" \
            --set app.api="https://${{ steps.id.outputs.RELEASE_API }}-${{ env.NAMESPACE }}.apps.gold.devops.gov.bc.ca/api" \
            --wait --timeout 5m

      - name: Seed test data
        run: |
          echo "Seeding test projects and invitation..."

          DB_POD=$(oc get pod -l app.kubernetes.io/instance=${{ steps.id.outputs.RELEASE_PATRONI }} -o jsonpath='{.items[0].metadata.name}')
          DB_NAME=$(oc get secret ${{ steps.id.outputs.RELEASE_PATRONI }} -o jsonpath='{.data.app-db-name}' | base64 -d)
          DB_USER=$(oc get secret ${{ steps.id.outputs.RELEASE_PATRONI }} -o jsonpath='{.data.app-db-username}' | base64 -d)

          oc cp submit-api/scripts/seed_e2e_test_data.sql $DB_POD:/tmp/seed.sql
          oc exec $DB_POD -- psql -U $DB_USER -d $DB_NAME -f /tmp/seed.sql

          echo "Test data seeded successfully"

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'

      - name: Install dependencies
        working-directory: ./submit-web
        run: npm install --legacy-peer-deps

      - name: Install Playwright Browsers
        working-directory: ./submit-web
        run: npx playwright install --with-deps chromium

      - name: Create .env.playwright
        working-directory: ./submit-web
        run: |
          cat > .env.playwright << EOF
          BASE_URL=https://${{ steps.id.outputs.RELEASE_WEB }}-${{ env.NAMESPACE }}.apps.gold.devops.gov.bc.ca
          STAFF_USERNAME=${{ secrets.STAFF_USERNAME }}
          STAFF_PASSWORD=${{ secrets.STAFF_PASSWORD }}
          PROPONENT_USERNAME=${{ secrets.PROPONENT_USERNAME }}
          PROPONENT_PASSWORD=${{ secrets.PROPONENT_PASSWORD }}
          EOF

      - name: Run Playwright tests
        working-directory: ./submit-web
        run: npx playwright test
        continue-on-error: true
        id: tests

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ steps.id.outputs.RUN_ID }}
          path: submit-web/playwright-report
          retention-days: 30

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-results-${{ steps.id.outputs.RUN_ID }}
          path: submit-web/test-results
          retention-days: 30

      - name: Cleanup ephemeral environment
        if: always()
        run: |
          echo "Cleaning up ephemeral environment..."

          helm uninstall ${{ steps.id.outputs.RELEASE_WEB }} -n ${{ env.NAMESPACE }} || true
          helm uninstall ${{ steps.id.outputs.RELEASE_API }} -n ${{ env.NAMESPACE }} || true
          helm uninstall ${{ steps.id.outputs.RELEASE_PATRONI }} -n ${{ env.NAMESPACE }} || true

          oc delete all,pvc,secret -l app.kubernetes.io/instance=${{ steps.id.outputs.RELEASE_PATRONI }} -n ${{ env.NAMESPACE }} --ignore-not-found=true

          echo "Cleanup completed"

      - name: Fail if tests failed
        if: steps.tests.outcome == 'failure'
        run: exit 1
```

**Key Features:**
- Unique run ID ensures no conflicts
- Sequential deployment: Patroni → API → Web
- `--wait --timeout 5m` ensures readiness
- Cleanup guaranteed via `if: always()`
- Artifacts uploaded for debugging

---

### Phase 3: Test Data Seeding

**File**: `submit-api/scripts/seed_e2e_test_data.sql` (new file)

**Minimal seeding strategy**: Seed only projects + invitation (NOT full user accounts)

```sql
-- =================================================================
-- Seed realistic test projects
-- =================================================================
INSERT INTO projects (id, name, ea_certificate, proponent_id, type, description, is_active, created_date)
VALUES
  (1000, 'Coastal GasLink Pipeline', 'E14-03', 'TCPL-001', 'ENERGY_ELECTRICITY',
   'Natural gas pipeline project in northern BC', true, NOW()),
  (1001, 'Site C Clean Energy Project', 'E13-01', 'BCH-001', 'ENERGY_ELECTRICITY',
   'Hydroelectric dam on the Peace River', true, NOW()),
  (1002, 'LNG Canada Export Terminal', 'E17-02', 'LNGC-001', 'INDUSTRIAL',
   'Liquefied natural gas export facility in Kitimat', true, NOW());

-- =================================================================
-- Seed invitation for new account creation
-- =================================================================
INSERT INTO invitations (id, token, email, project_ids, role_id, status, expiry_date, is_first_time, created_date)
VALUES (
  1000,
  'e2e-test-invitation-token-uuid',
  'proponent.test@example.com',
  ARRAY[1000, 1001],
  (SELECT id FROM roles WHERE role_name = 'PROJECT_ADMIN'),
  'PENDING',
  NOW() + INTERVAL '7 days',
  true,
  NOW()
);

-- =================================================================
-- Optional: Seed staff user for staff-side tests
-- =================================================================
-- Note: Replace STAFF_AUTH_GUID with actual value from DEV Keycloak
-- To find: oc exec submit-patroni-0 -n c8b80a-dev -- psql -U postgres -d submit -c "SELECT auth_guid FROM users WHERE email_address = 'staff.test@gov.bc.ca';"

-- INSERT INTO users (id, auth_guid, email_address, full_name, type, is_active, created_date)
-- VALUES (2000, 'REPLACE_WITH_ACTUAL_STAFF_GUID', 'staff.test@gov.bc.ca', 'E2E Test Staff User', 'STAFF', true, NOW());

-- INSERT INTO staff_users (id, user_id, deputy_director_id, is_active)
-- VALUES (3000, 2000, NULL, true);
```

**Why minimal seeding?**
- Tests the actual registration flow (better coverage)
- Less setup complexity
- More realistic user journey
- Test creates user/account organically

---

### Phase 4: First E2E Test

**File**: `submit-web/playwright/e2e/proponent-onboarding-and-submission.spec.ts` (new file)

This test validates the complete proponent journey from registration through CRUD operations.

```typescript
import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../auth";

const INVITATION_TOKEN = "e2e-test-invitation-token-uuid";

test.describe("Proponent Onboarding and Submission", () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test("complete proponent registration and create submission", async ({ page }) => {
    // ================================================================
    // PART 1: Complete Proponent Registration
    // ================================================================

    await page.goto(`/proponent/registration/?token=${INVITATION_TOKEN}`);
    await kcLogin(page, process.env.PROPONENT_USERNAME!, process.env.PROPONENT_PASSWORD!);

    await expect(page).toHaveURL(/\/proponent\/registration/);
    await expect(page.getByText(/Create Account/i)).toBeVisible();

    // Fill registration form
    await page.getByLabel(/Given Name/i).fill("E2E Test");
    await page.getByLabel(/Surname/i).fill("Proponent User");
    await page.getByLabel(/Position/i).fill("QA Engineer");
    await page.getByLabel(/Work Email/i).fill("proponent.test@example.com");
    await page.getByLabel(/Work Phone/i).fill("250-555-1234");
    await page.getByLabel(/Extension/i).fill("123");
    await page.getByRole("checkbox", { name: /Terms/i }).check();

    await page.getByRole("button", { name: /Create Account/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify "Add Projects" step
    await expect(page.getByText(/Coastal GasLink Pipeline/i)).toBeVisible();
    await expect(page.getByText(/Site C Clean Energy Project/i)).toBeVisible();

    await page.getByRole("button", { name: /Continue|Next/i }).click();

    await expect(page).toHaveURL(/\/proponent\/registration\/complete/);
    await expect(page.getByText(/congratulations|success/i)).toBeVisible();

    await page.getByRole("link", { name: /home|dashboard/i }).click();
    await page.waitForLoadState("networkidle");

    // ================================================================
    // PART 2: Verify User Can Access Projects
    // ================================================================

    await expect(page).toHaveURL(/\/proponent/);
    await expect(page.getByText(/Coastal GasLink Pipeline/i)).toBeVisible();

    // ================================================================
    // PART 3: Create New Submission (CRUD Test)
    // ================================================================

    await page.getByText(/Coastal GasLink Pipeline/i).click();
    await page.waitForLoadState("networkidle");

    // NOTE: Adjust selectors based on actual submission creation flow
    await page.getByRole("button", { name: /New Submission|Create/i }).first().click();

    const submissionTitle = `E2E Test Submission ${Date.now()}`;
    await page.getByLabel(/Title|Name/i).fill(submissionTitle);
    await page.getByLabel(/Description/i).fill("Automated E2E test submission");

    await page.getByRole("button", { name: /Submit|Create/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(submissionTitle)).toBeVisible();

    // ================================================================
    // PART 4: Verify Submission in List (Read operation)
    // ================================================================

    await page.goto("/proponent/submissions");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(submissionTitle)).toBeVisible();

    await page.getByText(submissionTitle).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Automated E2E test submission")).toBeVisible();
  });
});
```

**Test Coverage:**
1. **Registration** - Tests invitation-based onboarding flow
2. **Dashboard Access** - Validates account creation
3. **Submission Creation** - CRUD Create operation
4. **Submission Verification** - CRUD Read operation

---

## Resource Requirements

**Per test run:**
- **CPU**: ~295m request, ~375m limit
- **Memory**: ~612Mi request, ~1096Mi limit
- **Storage**: 256Mi PVC (ephemeral, deleted after tests)
- **Duration**: ~10-15 minutes total
  - Deployment: 5-7 minutes
  - Tests: 3-5 minutes
  - Cleanup: 1-2 minutes

**Cleanup Guarantee**: `if: always()` ensures resources removed even on test failure

---

## Service Architecture

### How Services Connect

1. **Web → API**: `https://submit-api-e2e-{run-id}-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`
2. **API → Database**: Via secret `submit-patroni-e2e-{run-id}` (auto-created by Patroni chart)
3. **API → Keycloak**: DEV Keycloak (`https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`)
4. **Web → Keycloak**: DEV Keycloak (no changes)
5. **API CORS**: Dynamically set to allow ephemeral web URL

### Database Migrations

Automatic via initContainer `pre-hook-update-db` in API deployment template:
- Runs `flask db upgrade` before main container starts
- Ensures fresh database has latest schema

---

## Critical Files Reference

### Helm Chart Templates (Phase 1)
- `deployment/charts/submit-api/templates/deployment.yaml`
- `deployment/charts/submit-api/templates/route.yaml`
- `deployment/charts/submit-api/templates/service.yaml`
- `deployment/charts/submit-api/templates/configmap.yaml`
- `deployment/charts/submit-web/templates/deployment.yaml`
- `deployment/charts/submit-web/templates/service.yaml`
- `deployment/charts/submit-web/templates/configmap.yaml`

### GitHub Actions (Phase 2)
- `.github/workflows/e2e.yml` - Complete workflow rewrite

### Test Data (Phase 3)
- `submit-api/scripts/seed_e2e_test_data.sql` - Minimal seed script

### Tests (Phase 4)
- `submit-web/playwright/e2e/proponent-onboarding-and-submission.spec.ts` - First comprehensive test

---

## Success Criteria

- [ ] Ephemeral stack deploys successfully in <7 minutes
- [ ] Tests can complete full proponent registration flow
- [ ] Tests can create/read/update/delete submissions
- [ ] All resources cleaned up after tests (verify: `oc get all -l app.kubernetes.io/instance=submit-patroni-e2e-*`)
- [ ] No interference with existing DEV environment
- [ ] Tests pass consistently (95%+ success rate)
- [ ] Artifacts (reports, traces) uploaded on completion

---

## Rollout Plan

### Week 1-2: Helm Chart Updates
- Update submit-api templates to use `.Release.Name`
- Update submit-web templates to use `.Release.Name`
- Test deployments manually with unique release names
- Verify service discovery and routing works

### Week 3: GitHub Actions Workflow
- Implement complete workflow with deployment steps
- Add seeding step with SQL script
- Test cleanup guarantees (simulate failures)
- Verify artifacts upload correctly

### Week 4: First CRUD Test
- Implement proponent onboarding test
- Adjust selectors based on actual UI
- Validate test passes in ephemeral environment
- Document any selector adjustments needed

### Week 5+: Expand Test Coverage
- Add Update and Delete CRUD operations
- Add staff-side workflow tests
- Add document upload tests
- Add validation/error handling tests

---

## Future Enhancements

### Potential Improvements
1. **Parallel Test Execution**: Run multiple isolated stacks concurrently
2. **Scheduled Orphan Cleanup**: Job to remove stray resources older than 6 hours
3. **Test Data Library**: Reusable fixtures for common test scenarios
4. **Performance Monitoring**: Track deployment and test execution times
5. **Visual Regression**: Screenshot comparison for UI consistency

### Additional Test Scenarios
- Document upload and download
- Submission review workflows (staff)
- User invitation flows
- Form validation and error handling
- Permission-based access control

---

## Troubleshooting Guide

### Common Issues

**Issue: Patroni fails to start**
- Check: `oc describe pod -l app.kubernetes.io/instance=submit-patroni-e2e-{run-id}`
- Likely cause: PVC pending (storage unavailable) or resource quota exceeded

**Issue: API migrations fail**
- Check: `oc logs deploy/submit-api-e2e-{run-id} -c pre-hook-update-db`
- Likely cause: Database not ready or connection string incorrect

**Issue: Tests can't access web**
- Check: `curl -I https://submit-web-e2e-{run-id}-c8b80a-dev.apps.gold.devops.gov.bc.ca`
- Likely cause: Route not created or pod not ready

**Issue: Cleanup leaves orphaned resources**
- Manual cleanup: `helm list -n c8b80a-dev | grep e2e`
- Force delete: `oc delete all,pvc,secret -l app.kubernetes.io/instance=submit-patroni-e2e-{run-id}`

---

## Appendix: Key Decisions Log

### Decision 1: Deploy in DEV Namespace (Not Separate Namespace)
**Rationale**: Simpler than managing separate namespaces, reuses existing infrastructure

### Decision 2: Seed Only Projects + Invitation (Not Full Users)
**Rationale**: Tests actual registration flow, better coverage, more realistic

### Decision 3: Use SQL Seeding (Not API-Based)
**Rationale**: Faster, more predictable, no authentication complexity

### Decision 4: Test Registration First (Before Pure CRUD)
**Rationale**: Validates complete user journey, sets up user organically

### Decision 5: CI Only (Local Dev Uses DEV)
**Rationale**: Simpler for developers, avoids local environment complexity

---

## Contact & References

**Related Documentation**:
- [E2E Testing Guide](./e2e-testing.md) - Current Playwright setup
- [Application Context](./application.md) - Overall architecture
- [CI/CD Deployment](./cicd-deployment.md) - Deployment infrastructure

**Key Technologies**:
- Playwright: https://playwright.dev
- OpenShift: https://www.redhat.com/en/technologies/cloud-computing/openshift
- Helm: https://helm.sh

**GitHub Workflow Examples**:
- Current e2e.yml: `.github/workflows/e2e.yml`
- API CD: `.github/workflows/api-cd.yml`
- Promote: `.github/workflows/promote.yml`

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Implementation Status**: Planning Complete - Ready to Execute
