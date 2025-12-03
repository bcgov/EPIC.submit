# 🧪 EPIC.submit — Cypress E2E Testing Plan (Disposable Namespace)

## 📘 Overview

This document outlines a full end-to-end testing strategy for the **EPIC.submit** application using **Cypress**, deployed in an **ephemeral OpenShift namespace** for each run.

The goal is to validate the integrated system — including frontend, backend, and database — through browser-driven tests, without interfering with shared development environments.

---

## 🎯 Goals

- Deploy the full stack into a **temporary OpenShift namespace**
- Seed test data via a Kubernetes Job
- Run Cypress browser-based tests against the deployed frontend
- Clean up test environments automatically
- Run tests **on demand** or on a **daily schedule**
- Support authentication via **Keycloak** in a way compatible with CI

---

## 🧩 Components Under Test

| Component       | Description                                |
|------------------|--------------------------------------------|
| `submit-api`     | Flask backend with PostgreSQL              |
| `submit-web`     | React frontend using `react-oidc-context`  |
| `submit-patroni` | PostgreSQL HA (can run in lightweight mode)|
| Keycloak         | External realm (managed by another team)   |
| Cypress          | E2E test runner (via GitHub Actions)       |

---

## 🔄 Test Execution Triggers

| Trigger Type       | Description                                       |
|--------------------|---------------------------------------------------|
| `workflow_dispatch`| Manual trigger with optional env inputs          |
| `schedule`         | Daily run at off-peak hours (04:00 UTC)           |
| `pull_request`     | ❌ Not used — avoids test runs on every PR        |

---

## ⚙️ Test Environment Lifecycle

Each test run goes through this lifecycle:

1. **Create Namespace**  
   Generate a temporary OpenShift namespace:
   ```
   submit-e2e-${GITHUB_RUN_ID}
   ```

2. **Deploy Components**  
   Deploy all required services using your existing Helm charts:
   - `submit-api`
   - `submit-web`
   - `submit-patroni` (lightweight DB)

3. **Configure Environment**  
   Override values for test-specific configuration (e.g., mock auth).

4. **Seed Test Data**  
   Run a Kubernetes Job that executes `flask seed` inside the API container.

5. **Run Cypress Tests**  
   Launch tests via the GitHub Actions runner using real HTTP requests to the frontend.

6. **Cleanup**  
   Delete the temporary namespace, even if tests fail.

---

## 🔐 Authentication Strategy

The EPIC.submit frontend is protected by Keycloak with IDIR login. Because automated testing against IDIR is not feasible (due to SSO redirects), the E2E environment uses a **test-mode flag** to bypass real Keycloak auth.

### ✅ E2E Auth Bypass (Safe, Controlled)

- Add an env var: `REACT_APP_E2E_TEST_MODE=true`
- In this mode, the frontend **injects a mock user** instead of initiating the Keycloak login flow
- Controlled by a conditional React wrapper (`E2EAuthProvider`), used only during E2E runs
- Prevents dependence on IDIR or external SSO systems

This keeps E2E tests fast, stable, and self-contained while avoiding auth-related flakiness.

---

## 🌱 Database Seeding

A `flask seed` command is implemented in `submit-api` to populate realistic test data.

### Kubernetes Job Example: `deployment/jobs/seed-data.yaml`

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: seed-data
spec:
  template:
    spec:
      containers:
        - name: seed
          image: <submit-api-image>
          command: ["flask", "seed"]
          envFrom:
            - secretRef:
                name: <your-db-secret>
      restartPolicy: Never
```

This job is applied after deployments, and blocks test execution until complete.

---

## 🤖 GitHub Actions Workflow: `.github/workflows/e2e.yml`

### Triggers:
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment (default: e2e)"
        required: false
        default: "e2e"
  schedule:
    - cron: '0 4 * * *'  # Daily at 04:00 UTC
```

### Key Steps (Summary):
- Login to OpenShift using service account
- Create `submit-e2e-<run_id>` namespace
- Deploy Helm charts for web/api/db
- Set `REACT_APP_E2E_TEST_MODE=true` in frontend
- Wait for rollout
- Run DB seeding job
- Run Cypress tests with `npx cypress run --e2e`
- Delete namespace

---

## 📁 Cypress Setup

### Directory Layout
```
submit-web/
├── cypress/
│   ├── e2e/
│   │   └── smoke.cy.ts
│   ├── support/
│   │   ├── commands.ts
│   │   └── e2e.ts
├── cypress.config.ts
```

### Example Test: `smoke.cy.ts`
```ts
describe('E2E Smoke Test', () => {
  it('should load dashboard and display mock user', () => {
    cy.visit('/');
    cy.contains('Welcome');
    cy.contains('e2e-user');
  });
});
```

### Cypress Config: `cypress.config.ts`
```ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
  },
});
```

---

## 🔐 Required GitHub Secrets

| Secret Name                  | Purpose                            |
|-----------------------------|------------------------------------|
| `OPENSHIFT_LOGIN_REGISTRY`  | OpenShift API URL                  |
| `OPENSHIFT_SA_TOKEN`        | Service account token              |
| `OPENSHIFT_CLUSTER_DOMAIN`  | e.g. `silver.devops.gov.bc.ca`     |

---

## ✅ Cleanup Policy

Namespaces are **always deleted** at the end of test runs using:

```yaml
- name: Cleanup namespace
  if: always()
  run: oc delete project $NAMESPACE
```

---

## ✅ Summary

| Capability                             | Status        |
|----------------------------------------|---------------|
| Disposable OpenShift test environment  | ✅ Implemented |
| Helm-based deployment                  | ✅ Reused      |
| Database seeding                       | ✅ Planned     |
| Cypress test execution                 | ✅ Planned     |
| Real Keycloak / IDIR bypass            | ✅ With mock   |
| Scheduled test runs                    | ✅ Daily @ 4am |
| Manual test runs                       | ✅ Supported   |
| PR-based test runs                     | ❌ Skipped     |

---

## 🚀 Future Enhancements

- Store Cypress results as GitHub artifacts
- Add Slack or Teams notifications on test failure
- Build out additional test scenarios (authZ, file uploads, etc.)
- Optionally run with a private Keycloak test realm

