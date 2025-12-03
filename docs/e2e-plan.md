# 🧪 EPIC.submit — Cypress E2E Testing Plan (Disposable Namespace)

## 📘 Overview

This document outlines a production-grade strategy for running **End-to-End (E2E) Cypress tests** against EPIC.submit in a fully deployed, **ephemeral OpenShift namespace**.

---

## 🎯 Goals

- Deploy a complete test environment (`submit-api`, `submit-web`, PostgreSQL) into a **disposable OpenShift namespace**
- Run Cypress tests with **mocked Keycloak auth** (no IDIR or redirects)
- Seed test data using a Kubernetes Job
- Automatically clean up after test runs
- Run tests on a **daily schedule** or via **manual trigger**

---

## 🚀 Workflow Triggers

| Trigger Type     | Description                                  |
|------------------|----------------------------------------------|
| `workflow_dispatch` | Manually triggered by developers             |
| `cron` (daily)   | Runs automatically at 04:00 UTC each day     |
| `pull_request`   | ❌ Not used (avoiding PR-based E2E tests)    |

---

## 🧱 Environment Architecture

Each E2E run:
1. Creates a disposable namespace (`submit-e2e-<run_id>`)
2. Deploys all app components via Helm
3. Seeds test data using a Job
4. Runs Cypress tests against the deployed frontend
5. Cleans up the namespace

---

## 🧩 Components Involved

| Component       | Description                                |
|------------------|--------------------------------------------|
| `submit-api`     | Flask backend with PostgreSQL              |
| `submit-web`     | React frontend using `react-oidc-context`  |
| `submit-patroni` | PostgreSQL HA cluster                      |
| Keycloak         | External (IDIR-backed) realm               |
| Cypress          | E2E test runner                            |

---

## 🔐 Auth Strategy: Mocking `react-oidc-context`

### Problem:
EPIC.submit uses Keycloak with **IDIR**, which **redirects to external login pages** that Cypress cannot automate.

### Solution:
In E2E mode, we **mock the `react-oidc-context` provider**, skipping the Keycloak login flow and injecting a fake user directly.

---

### ✅ Steps to Mock Auth in E2E

#### 1. Add `REACT_APP_E2E_TEST_MODE` flag to control auth mode

#### 2. Replace `<OidcProvider>` with a conditional wrapper

```tsx
// src/App.tsx or index.tsx
import { OidcProvider } from 'react-oidc-context';
import { E2EAuthProvider } from './auth/E2EAuthProvider';

const oidcConfig = { ... }; // Your actual Keycloak config
const isE2ETestMode = process.env.REACT_APP_E2E_TEST_MODE === 'true';

const App = () => {
  return isE2ETestMode ? (
    <E2EAuthProvider>
      <Routes />
    </E2EAuthProvider>
  ) : (
    <OidcProvider {...oidcConfig}>
      <Routes />
    </OidcProvider>
  );
};
```

---

#### 3. Create the mock provider: `src/auth/E2EAuthProvider.tsx`

```tsx
// submit-web/src/auth/E2EAuthProvider.tsx
import { createContext, useContext } from 'react';

const MockAuthContext = createContext({
  isAuthenticated: true,
  user: {
    profile: {
      preferred_username: 'e2e-user',
    },
    access_token: 'mock-token',
  },
  signIn: () => {},
  signOut: () => {},
});

export const E2EAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockAuthContext.Provider value={MockAuthContext._currentValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
```

---

#### 4. Helm Chart Override for E2E

In your `submit-web` Helm values:

```yaml
env:
  - name: REACT_APP_E2E_TEST_MODE
    value: "true"
```

This ensures the app skips Keycloak in E2E runs.

---

## 🧪 GitHub Workflow: `.github/workflows/e2e.yml`

```yaml
name: Cypress E2E Tests

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment (default: e2e)"
        required: false
        default: "e2e"
  schedule:
    - cron: '0 4 * * *'  # Daily at 04:00 UTC

env:
  NAMESPACE: submit-e2e-${{ github.run_id }}

jobs:
  e2e:
    runs-on: ubuntu-22.04
    if: github.repository == 'bcgov/EPIC.submit'

    steps:
      - uses: actions/checkout@v4

      - name: Login to OpenShift
        run: |
          oc login --server=${{ secrets.OPENSHIFT_LOGIN_REGISTRY }} --token=${{ secrets.OPENSHIFT_SA_TOKEN }}

      - name: Create namespace
        run: oc new-project $NAMESPACE

      - name: Deploy database
        run: |
          helm upgrade --install submit-patroni ./deployment/charts/submit-patroni \
            --namespace $NAMESPACE

      - name: Deploy API
        run: |
          helm upgrade --install submit-api ./deployment/charts/submit-api \
            --namespace $NAMESPACE \
            --set image.tag=${{ github.sha }}

      - name: Deploy Web (E2E mode)
        run: |
          helm upgrade --install submit-web ./deployment/charts/submit-web \
            --namespace $NAMESPACE \
            --set image.tag=${{ github.sha }} \
            --set env[0].name=REACT_APP_E2E_TEST_MODE \
            --set env[0].value=true

      - name: Wait for deployments
        run: |
          oc rollout status deployment/submit-api -n $NAMESPACE
          oc rollout status deployment/submit-web -n $NAMESPACE

      - name: Seed test data
        run: |
          oc apply -f ./deployment/jobs/seed-data.yaml -n $NAMESPACE
          oc wait --for=condition=complete job/seed-data -n $NAMESPACE --timeout=60s

      - name: Run Cypress tests
        working-directory: ./submit-web
        run: |
          npm ci
          npx cypress run --e2e
        env:
          CYPRESS_BASE_URL: "https://submit-web-${{ env.NAMESPACE }}.apps.${{ secrets.OPENSHIFT_CLUSTER_DOMAIN }}"

      - name: Cleanup namespace
        if: always()
        run: oc delete project $NAMESPACE
```

---

## 🌱 Database Seeding Job

Create file: `deployment/jobs/seed-data.yaml`

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

Requires a `flask seed` command to be implemented.

---

## 📁 Cypress Test Scaffolding

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

### Example `smoke.cy.ts`

```ts
describe('E2E Smoke Test', () => {
  it('loads the dashboard for a mock user', () => {
    cy.visit('/');
    cy.contains('Welcome'); // Adjust to match your app's text
    cy.contains('e2e-user');
  });
});
```

### `cypress.config.ts`

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

Always clean up the namespace at the end of the run:

```yaml
- name: Cleanup namespace
  if: always()
  run: oc delete project $NAMESPACE
```

---

## ✅ Summary

| Task                                  | Status       |
|---------------------------------------|--------------|
| Disposable OpenShift namespace        | ✅ Implemented |
| Helm-based app deployment             | ✅ Configured |
| Cypress E2E execution                 | ✅ Configured |
| Mocked Keycloak auth via env flag     | ✅ Implemented |
| Daily & manual test triggers only     | ✅ Configured |
| PR-based test execution               | ❌ Skipped    |

---

## 🚀 Future Enhancements

- Store Cypress HTML reports as artifacts
- Add more detailed test cases (permissions, edge cases)
- Optional: spin up private Keycloak for complete isolation
