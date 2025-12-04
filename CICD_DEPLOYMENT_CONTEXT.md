# EPIC.submit - CI/CD and Deployment Context

## Overview

EPIC.submit uses a modern CI/CD pipeline built on GitHub Actions with deployments to OpenShift (Red Hat's Kubernetes distribution). The system follows a GitOps approach with automated builds, testing, and deployments across multiple environments (dev, test, prod).

## Table of Contents

1. [CI/CD Pipeline Architecture](#cicd-pipeline-architecture)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Deployment Strategy](#deployment-strategy)
4. [Container Images and Builds](#container-images-and-builds)
5. [Helm Charts](#helm-charts)
6. [Environment Configuration](#environment-configuration)
7. [Secrets Management](#secrets-management)
8. [Deployment Process Flow](#deployment-process-flow)

---

## CI/CD Pipeline Architecture

### Pipeline Structure

The CI/CD pipeline is separated into:
- **CI (Continuous Integration)**: Automated testing and validation on pull requests
- **CD (Continuous Deployment)**: Automated deployment to dev environment on merge
- **Promotion**: Manual promotion between environments (dev → test → prod)

### Components

Three separate microservices with independent CI/CD pipelines:
1. **submit-api** - Backend Flask API
2. **submit-web** - Frontend React application
3. **submit-cron** - Background job scheduler

---

## GitHub Actions Workflows

### 1. Continuous Integration (CI) Workflows

#### API CI Workflow ([api-ci.yml](.github/workflows/api-ci.yml))

**Trigger**: Pull requests to `develop` branch with changes in `submit-api/**`

**Jobs**:

1. **Linting**
   - Python version: 3.9
   - Tools: pylint, flake8
   - Dependencies: libsasl2-dev, libldap2-dev, libssl-dev
   - Command: `make pylint && make flake8`

2. **Testing**
   - Python version: 3.9
   - Services: PostgreSQL 12 (Docker container)
   - Test framework: pytest
   - Database: PostgreSQL with health checks
   - Environment: Uses test Keycloak configuration
   - Command: `make test`
   - Note: Codecov integration is commented out but available

3. **Build**
   - Builds Docker image: `docker build . -t reports-api`
   - Validates Dockerfile builds successfully

**Test Configuration**:
```yaml
DATABASE_TEST_URL: postgresql://postgres:postgres@localhost:5432/postgres
JWT_OIDC_TEST_ISSUER: http://localhost:8081/auth/realms/demo
KEYCLOAK_TEST_BASE_URL: http://localhost:8081
USE_TEST_KEYCLOAK_DOCKER: YES
```

#### Web CI Workflow ([web.ci.yml](.github/workflows/web.ci.yml))

**Trigger**:
- Pull requests to `develop` branch with changes in `submit-web/**`
- Push to `develop` branch
- Manual workflow dispatch

**Jobs**:

1. **Linting**
   - Node.js version: 18.x
   - Package manager: npm with --legacy-peer-deps
   - Command: `npm run lint`

2. **Testing**
   - Test framework: Cypress (component tests)
   - Browser: Chrome (headed mode)
   - Command: `npx cypress run --component --headed --browser chrome`
   - Coverage: nyc for code coverage reporting
   - Note: Codecov integration available but commented out

3. **Build Check**
   - Validates TypeScript compilation
   - Command: `npm run build --quiet`
   - Purpose: Ensure production build succeeds

### 2. Continuous Deployment (CD) Workflows

#### API CD Workflow ([api-cd.yml](.github/workflows/api-cd.yml))

**Trigger**:
- Push to `develop` branch with changes in `submit-api/**`
- Manual workflow dispatch with environment selection

**Environment**: `dev` (default) or manually selected

**Steps**:

1. **Login to OpenShift**
   ```bash
   oc login --server=${{secrets.OPENSHIFT_LOGIN_REGISTRY}} --token=${{secrets.OPENSHIFT_SA_TOKEN}}
   ```

2. **Login to Docker Registry**
   - Registry: OpenShift internal registry
   - Authentication: Service account token

3. **Build Image**
   ```bash
   docker build . --file Dockerfile --tag image
   ```

4. **Push Image**
   - Tag image as `latest` and environment-specific tag
   - Repository: `{OPENSHIFT_REPOSITORY}-tools/submit-api`
   - Tags: `latest`, `{environment}` (dev/test/prod)

5. **Add Metadata to OpenShift**
   - Annotates ImageStreamTag with commit information:
     - commit-sha: Full commit SHA
     - build-info: Short SHA, author, timestamp, commit message
   ```bash
   oc annotate istag submit-api:$TAG_NAME \
     commit-sha=${{ github.sha }} \
     build-info="..." \
     --overwrite
   ```

6. **Rollout Deployment**
   ```bash
   oc rollout restart deployment/submit-api -n {namespace}-{environment}
   ```

#### Web CD Workflow ([web-cd.yml](.github/workflows/web-cd.yml))

**Trigger**:
- Push to `develop` branch with changes in `submit-web/**`
- Manual workflow dispatch

**Steps**: Same as API CD workflow but for submit-web

#### Cron CD Workflow ([cron-cd.yaml](.github/workflows/cron-cd.yaml))

**Trigger**:
- Push to `develop` branch with changes in `submit-cron/**` or `submit-api/**`
- Manual workflow dispatch

**Note**: Cron service depends on submit-api changes, so it rebuilds when API changes

**Steps**: Same as API CD workflow but for submit-cron

### 3. Deployment and Promotion Workflows

#### Deploy Workflow ([deploy.yml](.github/workflows/deploy.yml))

**Purpose**: Deploy to test or production by promoting dev images

**Trigger**: Manual workflow dispatch only

**Inputs**:
- environment: `test` or `prod`

**Steps**:

1. **Tag Images**
   - Tags dev images with target environment tag
   ```bash
   oc tag submit-api:dev submit-api:{environment}
   oc tag submit-web:dev submit-web:{environment}
   oc tag submit-cron:dev submit-cron:{environment}
   ```

2. **Wait for Rollout**
   - Monitors deployment completion
   ```bash
   oc rollout status dc/submit-api -n {namespace}-{environment} -w
   oc rollout status dc/submit-web -n {namespace}-{environment} -w
   oc rollout status dc/submit-cron -n {namespace}-{environment} -w
   ```

#### Promote Workflow ([promote.yml](.github/workflows/promote.yml))

**Purpose**: Promote images between environments with backup

**Trigger**: Manual workflow dispatch only

**Inputs**:
- source_env: Source environment (e.g., dev, test)
- target_env: Target environment (e.g., test, prod)

**Steps**:

1. **Backup Current Target Images**
   - Creates timestamped backup of current target environment
   ```bash
   TIMESTAMP=$(date +%Y-%m-%d-%H%M)
   oc tag submit-api:{target_env} submit-api:{target_env}-backup-${TIMESTAMP}
   oc tag submit-web:{target_env} submit-web:{target_env}-backup-${TIMESTAMP}
   oc tag submit-cron:{target_env} submit-cron:{target_env}-backup-${TIMESTAMP}
   ```

2. **Promote Images**
   - Tags source environment images to target environment
   ```bash
   oc tag submit-api:{source_env} submit-api:{target_env}
   oc tag submit-web:{source_env} submit-web:{target_env}
   oc tag submit-cron:{source_env} submit-cron:{target_env}
   ```

3. **Rollout to Target Environment**
   - Restarts deployments in target environment
   ```bash
   oc rollout restart deployment/submit-api -n {namespace}-{target_env}
   oc rollout restart deployment/submit-web -n {namespace}-{target_env}
   oc rollout restart deployment/submit-cron -n {namespace}-{target_env}
   ```

### 4. Quality and Security Workflows

#### PR Title Check ([pr-title-check.yml](.github/workflows/pr-title-check.yml))

**Purpose**: Enforce PR naming conventions

**Trigger**: Pull request events (opened, edited, reopened, synchronize)

**Validation**:
- PR title must include Jira ticket number
- Pattern: `SUBMIT-[0-9]+` (e.g., SUBMIT-123)
- Fails CI if pattern not found

#### OWASP ZAP Security Scan ([zap-scan.yml](.github/workflows/zap-scan.yml))

**Purpose**: Automated security scanning for vulnerabilities

**Trigger**:
- Manual workflow dispatch (with URL input)
- Push to `development` branch

**Configuration**:
- Tool: OWASP ZAP (zaproxy/action-full-scan@v0.12.0)
- Scan type: Full scan
- Options: `-a -d` (active scan with detailed output)
- Target: Configured via secret or manual input

**Output**: OWASP ZAP Scan artifact

---

## Deployment Strategy

### Platform

**OpenShift (Kubernetes)** - BC Government Gold Cluster
- Cluster domain: `apps.gold.devops.gov.bc.ca`
- Registry: OpenShift internal image registry
- Namespace pattern: `{project}-{environment}`
- Project code: `c8b80a`

### Environments

1. **Dev** (Development)
   - Namespace: `c8b80a-dev`
   - Auto-deploy on merge to `develop` branch
   - Used for development and integration testing

2. **Test** (Testing/Staging)
   - Namespace: `c8b80a-test`
   - Manual promotion from dev
   - Used for QA and user acceptance testing

3. **Prod** (Production)
   - Namespace: `c8b80a-prod`
   - Manual promotion from test
   - Production environment

4. **Tools** (Build/CI)
   - Namespace: `c8b80a-tools`
   - Contains build configs and image streams
   - Shared across all environments

### Deployment Pattern

**Blue-Green / Rolling Deployment**
- Strategy: RollingUpdate
- MaxSurge: 25%
- MaxUnavailable: 25%
- Zero-downtime deployments

### Image Management

**Image Streams**:
- Location: `{project}-tools` namespace
- Naming: `{service}:{tag}`
- Tags: `latest`, `dev`, `test`, `prod`, `{env}-backup-{timestamp}`

**Image Promotion Flow**:
```
develop branch → build → latest & dev tags
dev tag → promote → test tag
test tag → promote → prod tag
```

---

## Container Images and Builds

### Submit API (Python/Flask)

**Dockerfile**: `submit-api/Dockerfile`

**Base Image**: `python:3.9-buster`

**Build Steps**:
1. Create working directory `/opt/app-root`
2. Copy and install requirements from `requirements.txt`
3. Upgrade pip and install dependencies
4. Copy application code
5. Install application: `pip install .`
6. Switch to non-root user (1001)
7. Set Python path
8. Entrypoint: `docker-entrypoint.sh`

**Runtime Configuration**:
- User: 1001 (non-root)
- Port: 8080
- Python Path: `/opt/app-root/src`
- Entry script: Runs Flask application

### Submit Web (React/Nginx)

**Dockerfile**: `submit-web/Dockerfile`

**Multi-stage Build**:

**Stage 1: Build** (Node.js)
- Base: `node:16-alpine`
- Install dependencies with npm
- Build React application: `npm run build`
- Output: Compiled static files in `/app/dist`

**Stage 2: Production** (Nginx)
- Base: `nginx:1.17`
- Copy build artifacts from Stage 1
- Copy custom nginx configuration
- Expose port: 8081
- Serve static files with Nginx

**Configuration**:
- Custom nginx.conf for SPA routing
- Production-ready static file serving
- Optimized for OpenShift

### Submit Cron (Python)

**Dockerfile**: Similar to submit-api

**Purpose**: Background job scheduler
- Runs scheduled tasks
- Executes email notifications
- Syncs project metadata from Epic.Track

---

## Helm Charts

Helm is used for Kubernetes deployment templating and configuration management.

### Chart Structure

```
deployment/charts/
├── submit-api/           # API deployment chart
├── submit-api-bc/        # API build config chart
├── submit-web/           # Web deployment chart
├── submit-web.bc/        # Web build config chart
├── submit-cron/          # Cron deployment chart
└── submit-patroni/       # PostgreSQL database chart
```

### Submit API Helm Chart

**Location**: `deployment/charts/submit-api/`

**Chart.yaml**:
- Name: submit-api
- Type: application
- Version: 1.0.0
- App Version: 1.0.0

**Key Templates**:

1. **Deployment** ([deployment.yaml](deployment/charts/submit-api/templates/deployment.yaml))
   - Init Container: Database migration (`pre-hook-update-db.sh`)
   - Main Container: Flask application
   - Replicas: 1 (configurable)
   - Strategy: RollingUpdate (25% surge/unavailable)
   - Health checks: `/ops/healthz` (liveness), `/ops/readyz` (readiness)
   - Probes: 10s period, 3 failure threshold

2. **Service** ([service.yaml](deployment/charts/submit-api/templates/service.yaml))
   - Type: ClusterIP
   - Port: 8080
   - Target Port: 8080

3. **Route** ([route.yaml](deployment/charts/submit-api/templates/route.yaml))
   - Host: `submit-api-{namespace}.apps.gold.devops.gov.bc.ca`
   - TLS: Edge termination
   - Redirect: HTTP to HTTPS

4. **ConfigMap** ([configmap.yaml](deployment/charts/submit-api/templates/configmap.yaml))
   - JWT/OIDC configuration
   - Keycloak settings
   - CORS origins
   - Python settings
   - Connection timeouts

5. **Secret** ([secret.yaml](deployment/charts/submit-api/templates/secret.yaml))
   - Keycloak admin credentials
   - Database credentials (from patroni secret)

**Values** ([values.yaml](deployment/charts/submit-api/values.yaml)):
```yaml
replicaCount: 1
image:
  repository: image-registry.openshift-image-registry.svc:5000/c8b80a-tools/submit-api
  tag: dev
  pullPolicy: Always

resources:
  cpu:
    limit: 100m
    request: 75m
  memory:
    limit: 384Mi
    request: 256Mi

database:
  secret: submit-patroni
  service:
    name: submit-patroni
    port: 5432

auth:
  jwt:
    alg: RS256
    aud: epic-submit
    issuer: https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic
    wellKnownConfig: https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic/.well-known/openid-configuration
    cacheEnabled: true
    cacheTimeout: 300

  keycloak:
    uri: https://dev.loginproxy.gov.bc.ca
    realm: eao-epic

cors:
  origin: "https://dev.submit.eao.gov.bc.ca,"
```

### Submit Web Helm Chart

**Location**: `deployment/charts/submit-web/`

**Key Templates**:

1. **Deployment** ([deployment.yaml](deployment/charts/submit-web/templates/deployment.yaml))
   - Container: Nginx serving React SPA
   - Port: 8080
   - ConfigMap mount: Runtime configuration at `/usr/share/nginx/html/config/`
   - Health checks: HTTP on port 8080

2. **Service**
   - Type: ClusterIP
   - Port: 8080

3. **Route**
   - Host: `submit-web-{namespace}.apps.gold.devops.gov.bc.ca`
   - TLS: Edge termination

4. **ConfigMap**
   - API endpoint URL
   - OIDC configuration
   - Environment-specific settings
   - External service URLs (object storage, conditions library)

**Values** ([values.yaml](deployment/charts/submit-web/values.yaml)):
```yaml
app:
  name: submit
  url: submit-web-{namespace}.apps.gold.devops.gov.bc.ca
  api: https://submit-api-{namespace}.apps.gold.devops.gov.bc.ca/api
  env: dev
  version: 1.0.0
  title: EPIC.Submit
  objectStorageUrl: https://epic-document-{namespace}.apps.gold.devops.gov.bc.ca/api
  oidcAuthority: https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic
  clientId: epic-submit
  conditionsLibraryUrl: https://condition-api-{namespace}.gold.devops.gov.bc.ca/api

resources:
  cpu:
    limit: 200m
    request: 200m
  memory:
    limit: 200Mi
    request: 100Mi

replicas:
  count: 1
```

### Submit Cron Helm Chart

**Location**: `deployment/charts/submit-cron/`

**Key Features**:

1. **Deployment**
   - Runs scheduled jobs
   - Cron schedule: `*/5 * * * *` (every 5 minutes)
   - Job: Email notifications (`run_emailer.sh`)

2. **Secrets**
   - CHES (Common Hosted Email Service) credentials
   - Database connection

**Values** ([values.yaml](deployment/charts/submit-cron/values.yaml)):
```yaml
name: submit-cron
imageNamespace: c8b80a-tools
env: dev
imageTag: dev

database:
  host: submit-patroni
  port: "5432"

resources:
  requests:
    cpu: 100m
    memory: 100Mi
  limits:
    cpu: 250m
    memory: 200Mi

cronTab: "*/5 * * * * default cd /submit-cron && ./run_emailer.sh"

chesSecrets:
  create: true
  tokenEndPoint: "https://dev.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token"
  apiEndPoint: "https://ches-dev.api.gov.bc.ca"
  clientId: ""
  clientSecret: ""

web:
  url: "https://dev.submit.eao.gov.bc.ca"

sender:
  email: "EAO.ManagementPlanSupport@gov.bc.ca"
```

### Submit Patroni (PostgreSQL) Helm Chart

**Location**: `deployment/charts/submit-patroni/`

**Purpose**: High-availability PostgreSQL cluster using Patroni

**Key Features**:

1. **StatefulSet**
   - Provides stable pod identity
   - Persistent storage for database

2. **Persistent Volume**
   - Size: 256Mi (configurable)
   - Storage class: netapp-block-standard
   - Mount path: `/home/postgres/pgdata`
   - Access mode: ReadWriteOnce

3. **Service**
   - Primary: Read-write operations
   - Read-only: Read replicas (if enabled)
   - Port: 5432

4. **Network Policy**
   - Enabled: Controls pod communication
   - Restricts database access

5. **Service Account**
   - Created automatically
   - Required for Patroni operations

**Values** ([values.yaml](deployment/charts/submit-patroni/values.yaml)):
```yaml
replicaCount: 1

image:
  repository: artifacts.developer.gov.bc.ca/bcgov-docker-local
  name: patroni-postgres
  pullPolicy: Always

resources:
  limits:
    cpu: 75m
    memory: 512Mi
  requests:
    cpu: 20m
    memory: 256Mi

persistentVolume:
  enabled: true
  accessModes:
    - ReadWriteOnce
  mountPath: "/home/postgres/pgdata"
  size: 256Mi
  storageClass: "netapp-block-standard"

service:
  enableReadOnly: true
  type: ClusterIP
  port: 5432

networkPolicy:
  enabled: true

probes:
  liveness:
    enabled: true
  readiness:
    enabled: true
```

### Build Config Helm Charts

**Purpose**: Define OpenShift BuildConfigs for source-to-image builds

**API Build Config** ([submit-api-bc](deployment/charts/submit-api-bc/)):
- Type: Docker build
- Source: Git repository
- Branch: develop
- Context: `submit-api/`
- Output: ImageStreamTag `submit-api:latest`
- Triggers: ConfigChange
- Build history: 5 successful, 5 failed

**Template** ([buildconfig.yaml](deployment/charts/submit-api-bc/templates/buildconfig.yaml)):
```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: {{ .Values.app }}
spec:
  output:
    to:
      kind: ImageStreamTag
      name: '{{ .Values.app }}:latest'
  successfulBuildsHistoryLimit: 5
  failedBuildsHistoryLimit: 5
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
  source:
    type: Git
    git:
      uri: {{ .Values.githubRepo }}
      ref: develop
      contextDir: {{ .Values.githubContextDir }}
  triggers:
  - type: ConfigChange
  runPolicy: Serial
```

---

## Environment Configuration

### Environment Variables

#### Submit API

**Database**:
- `DATABASE_USERNAME` - App database username (from secret)
- `DATABASE_PASSWORD` - App database password (from secret)
- `DATABASE_NAME` - Database name (from secret)
- `DATABASE_HOST` - Database service name (submit-patroni)
- `DATABASE_PORT` - Database port (5432)

**Authentication (JWT/OIDC)**:
- `JWT_OIDC_ALGORITHMS` - RS256
- `JWT_OIDC_AUDIENCE` - epic-submit
- `JWT_OIDC_CACHING_ENABLED` - true
- `JWT_OIDC_ISSUER` - Keycloak realm URL
- `JWT_OIDC_JWKS_CACHE_TIMEOUT` - 300 seconds
- `JWT_OIDC_WELL_KNOWN_CONFIG` - OIDC discovery endpoint

**Keycloak Admin**:
- `KEYCLOAK_BASE_URL` - Keycloak server URL
- `KEYCLOAK_REALM_NAME` - eao-epic
- `KEYCLOAK_ADMIN_CLIENT` - Admin client ID (from secret)
- `KEYCLOAK_ADMIN_SECRET` - Admin client secret (from secret)

**Application**:
- `PYTHONBUFFERED` - 1 (unbuffered output)
- `CONNECT_TIMEOUT` - 60 seconds
- `CORS_ORIGIN` - Allowed origins (comma-separated)

#### Submit Web

**Runtime Configuration** (ConfigMap mounted as JSON):
- `REACT_APP_API_URL` - API endpoint
- `REACT_APP_KEYCLOAK_URL` - Keycloak URL
- `REACT_APP_KEYCLOAK_REALM` - Realm name
- `REACT_APP_KEYCLOAK_CLIENT_ID` - Client ID
- `REACT_APP_OBJECT_STORAGE_URL` - S3 bucket URL
- `REACT_APP_CONDITIONS_LIBRARY_URL` - Conditions API URL
- `REACT_APP_ENV` - Environment name (dev/test/prod)

#### Submit Cron

**Database**: Same as API

**Email (CHES)**:
- `CHES_TOKEN_ENDPOINT` - OAuth token endpoint
- `CHES_API_ENDPOINT` - CHES API URL
- `CHES_CLIENT_ID` - Client ID (from secret)
- `CHES_CLIENT_SECRET` - Client secret (from secret)
- `SENDER_EMAIL` - From email address
- `WEB_URL` - Frontend URL for email links

### URL Patterns by Environment

#### Dev Environment
- Web: `https://dev.submit.eao.gov.bc.ca`
- API: `https://submit-api-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`
- Keycloak: `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- Object Storage: `https://epic-document-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`

#### Test Environment
- Web: `https://test.submit.eao.gov.bc.ca`
- API: `https://submit-api-c8b80a-test.apps.gold.devops.gov.bc.ca/api`
- Keycloak: `https://test.loginproxy.gov.bc.ca/auth/realms/eao-epic`

#### Production Environment
- Web: `https://submit.eao.gov.bc.ca`
- API: `https://submit-api-c8b80a-prod.apps.gold.devops.gov.bc.ca/api`
- Keycloak: `https://loginproxy.gov.bc.ca/auth/realms/eao-epic`

---

## Secrets Management

### OpenShift Secrets

Secrets are managed in OpenShift and referenced in Helm charts.

#### Required Secrets

**1. Database Secret** (`submit-patroni`)
- `app-db-name` - Application database name
- `app-db-username` - Application database user
- `app-db-password` - Application database password
- Source: Created by Patroni Helm chart

**2. API Secret** (`submit-api`)
- `KEYCLOAK_ADMIN_CLIENT` - Keycloak admin client ID
- `KEYCLOAK_ADMIN_SECRET` - Keycloak admin client secret

**3. CHES Secret** (`submit-cron-ches`)
- `CHES_CLIENT_ID` - Email service client ID
- `CHES_CLIENT_SECRET` - Email service client secret

**4. GitHub Actions Secrets**
- `OPENSHIFT_LOGIN_REGISTRY` - OpenShift API server URL
- `OPENSHIFT_SA_TOKEN` - Service account token for deployments
- `OPENSHIFT_SA_NAME` - Service account name
- `OPENSHIFT_IMAGE_REGISTRY` - Image registry URL
- `OPENSHIFT_REPOSITORY` - Project/namespace prefix (c8b80a)
- `ZAP_SCAN_URL` - Target URL for security scans (optional)

### Secret Injection Methods

1. **Environment Variables** - Database credentials, API keys
2. **ConfigMaps** - Non-sensitive configuration
3. **Volume Mounts** - Configuration files (e.g., runtime config for web)

---

## Deployment Process Flow

### Development Workflow

```
Developer commits code
    ↓
Push to feature branch
    ↓
Create Pull Request to develop
    ↓
CI Pipeline Triggers:
  - Lint code (pylint/flake8/eslint)
  - Run tests (pytest/cypress)
  - Build check
  - PR title validation (SUBMIT-XXX)
    ↓
Code Review & Approval
    ↓
Merge to develop branch
    ↓
CD Pipeline Triggers:
  - Build Docker image
  - Tag as 'latest' and 'dev'
  - Push to OpenShift registry
  - Annotate with build metadata
  - Rollout restart deployment in dev namespace
    ↓
Dev Environment Updated
```

### Test Environment Promotion

```
Manual Trigger: Deploy workflow
    ↓
Input: environment = "test"
    ↓
Tag dev images as test:
  - submit-api:dev → submit-api:test
  - submit-web:dev → submit-web:test
  - submit-cron:dev → submit-cron:test
    ↓
Wait for rollout status
    ↓
Test Environment Updated
```

### Production Deployment

```
Manual Trigger: Promote workflow
    ↓
Input: source = "test", target = "prod"
    ↓
Backup current prod images:
  - submit-api:prod → submit-api:prod-backup-{timestamp}
  - submit-web:prod → submit-web:prod-backup-{timestamp}
  - submit-cron:prod → submit-cron:prod-backup-{timestamp}
    ↓
Promote test images to prod:
  - submit-api:test → submit-api:prod
  - submit-web:test → submit-web:prod
  - submit-cron:test → submit-cron:prod
    ↓
Rollout restart deployments in prod
    ↓
Production Environment Updated
```

### Database Migration Flow

```
New deployment triggered
    ↓
Init Container starts: pre-hook-update-db
    ↓
Run Flask-Migrate (Alembic) migrations:
  - Connect to database
  - Apply pending migrations
  - Update schema
    ↓
Init container completes
    ↓
Main application container starts
    ↓
Application ready
```

---

## Health Checks and Monitoring

### API Health Endpoints

**Liveness Probe**: `/ops/healthz`
- Purpose: Check if application is running
- Timeout: 1s
- Period: 10s
- Failure threshold: 3

**Readiness Probe**: `/ops/readyz`
- Purpose: Check if application is ready to serve traffic
- Timeout: 10s
- Period: 10s
- Failure threshold: 3

### Database Health

**Patroni Health Checks**:
- Liveness: Checks if Patroni process is running
- Readiness: Checks if PostgreSQL is ready to accept connections

### Rollout Monitoring

**OpenShift Rollout Status**:
```bash
oc rollout status deployment/{service} -n {namespace} -w
```
- Monitors deployment progress
- Waits for successful rollout
- Reports any failures

---

## Resource Allocation

### API Resources
```yaml
requests:
  cpu: 75m
  memory: 256Mi
limits:
  cpu: 100m
  memory: 384Mi
```

### Web Resources
```yaml
requests:
  cpu: 200m
  memory: 100Mi
limits:
  cpu: 200m
  memory: 200Mi
```

### Cron Resources
```yaml
requests:
  cpu: 100m
  memory: 100Mi
limits:
  cpu: 250m
  memory: 200Mi
```

### Database Resources
```yaml
requests:
  cpu: 20m
  memory: 256Mi
limits:
  cpu: 75m
  memory: 512Mi
storage: 256Mi (netapp-block-standard)
```

---

## Key Deployment Features

### 1. Zero-Downtime Deployments
- Rolling update strategy
- Health checks ensure pods are ready
- 25% max surge/unavailable

### 2. Database Migrations
- Automatic on deployment via init container
- Alembic migration management
- No manual intervention required

### 3. Configuration Management
- Helm charts for templating
- ConfigMaps for environment-specific config
- Secrets for sensitive data

### 4. Image Versioning
- Multiple tags per image (latest, env-specific)
- Timestamped backups before promotion
- Easy rollback capability

### 5. Security
- Non-root container users
- Network policies
- TLS termination at edge
- OWASP ZAP security scanning
- Secret management via OpenShift

### 6. Monitoring
- Health check endpoints
- Rollout status monitoring
- Build metadata annotations

---

## Best Practices

1. **Always test in dev before promoting to test/prod**
2. **Use the promote workflow for prod deployments** (includes backups)
3. **Monitor rollout status after deployments**
4. **Keep PR titles with Jira ticket numbers** (enforced by CI)
5. **Review build metadata annotations** for deployment tracking
6. **Use manual triggers for test/prod deployments** (no auto-deploy)
7. **Verify database migrations** complete successfully
8. **Check health endpoints** after deployment

---

## Troubleshooting

### Common Issues

**1. Build Failures**
- Check Dockerfile syntax
- Verify dependencies in requirements.txt / package.json
- Review build logs in OpenShift

**2. Deployment Failures**
- Check pod logs: `oc logs {pod-name}`
- Verify secrets exist: `oc get secret`
- Check resource limits
- Review init container logs (migration issues)

**3. Health Check Failures**
- Verify endpoints `/ops/healthz` and `/ops/readyz`
- Check application startup time
- Review timeout settings

**4. Image Pull Errors**
- Verify image tag exists
- Check service account permissions
- Confirm registry credentials

---

## Summary

EPIC.submit employs a robust CI/CD pipeline using:
- **GitHub Actions** for automated builds and deployments
- **OpenShift/Kubernetes** for container orchestration
- **Helm** for deployment configuration management
- **Docker** for containerization
- **PostgreSQL with Patroni** for high-availability database

The pipeline ensures code quality through automated testing, provides zero-downtime deployments, and follows GitOps principles with manual promotion to higher environments for controlled releases.
