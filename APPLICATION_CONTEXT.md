# EPIC.submit - Application Context

## Overview

**EPIC.submit** is a comprehensive document and submission management system for the Environmental Assessment Office (EAO) in British Columbia. It enables certificate/exemption holders to submit management plans and post-certificate documents to the EAO, and allows EAO staff to review, approve, reject, or request revisions to submissions.

## Application Type

This is a **full-stack web application** composed of three main services:
- **Frontend**: React-based Single Page Application (SPA)
- **Backend**: Python Flask REST API
- **Background Service**: Python cron job scheduler

The application is built as a microservices architecture with separate deployable components that work together as an integrated system.

## Primary Purpose and Functionality

### Key Capabilities
- **Certificate/Exemption Holders** can submit management plans and post-certificate documents to the EAO
- **EAO Staff** can review, approve, reject, or request revisions to submissions
- **Version control** and tracking of document submissions
- **Status monitoring** of submissions through their lifecycle
- **Team collaboration** for both proponents and EAO staff
- **Direct communication** between users and the EAO via update requests and notes

### Key Workflows
- Submission lifecycle management (NEW → SUBMITTED → IN_REVIEW → APPROVED/REJECTED)
- Request for updates and revisions
- Document upload and version tracking
- User role management and account administration
- Consultation record tracking
- Email notifications for status changes

## Technology Stack

### Frontend (submit-web)
- **Framework**: React 18.2.0
- **Language**: TypeScript
- **Routing**: TanStack Router (React Router)
- **State Management**: Zustand, TanStack React Query (data fetching)
- **UI Components**: Material-UI (MUI) 5.15.x with Emotion for styling
- **Forms**: React Hook Form with Yup validation
- **Build Tool**: Vite 5.2.0
- **Testing**: Cypress (E2E and component testing)
- **Authentication**: Keycloak/OIDC via react-oidc-context
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Code Quality**: ESLint, TypeScript strict mode, Prettier

### Backend (submit-api)
- **Framework**: Flask (Python)
- **Language**: Python 3.9+
- **Database ORM**: SQLAlchemy
- **Database Migration**: Flask-Migrate (Alembic)
- **Serialization**: Marshmallow
- **Authentication**: Flask-JWT-Extended with Keycloak/OIDC
- **CORS**: Flask-CORS
- **Caching**: Flask-Caching
- **Security**: python-secure library for response headers
- **Testing**: pytest
- **Code Quality**: pylint, flake8, autopep8

### Background Jobs (submit-cron)
- **Framework**: Python Flask
- **Scheduler**: Custom job scheduler (APScheduler-like implementation)
- **Purpose**: Synchronizes project metadata from Epic.Track database

### Database
- **Engine**: PostgreSQL
- **Migrations**: Flask-Migrate with Alembic
- **Data Storage**: Relational schema with support for user accounts, submissions, packages, items, documents, etc.

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Orchestration**: OpenShift/Kubernetes
- **CI/CD**: GitHub Actions
- **Package Management**: npm (frontend), pip (backend)
- **Build Artifacts**: Helm charts for deployment

### External Integrations
- **Identity Provider**: Keycloak (OIDC authentication)
- **Project Metadata**: Epic.Track system
- **Document Storage**: S3-compatible bucket (Epic.Document)
- **Compliance Data**: Epic.Conditions repository

## Main Components and Their Roles

### Backend Components (Flask API)

#### API Resources & Endpoints

**Proponent Endpoints** (proponent/)
- `account.py` - Account management
- `submission.py` - Submission management
- `activity_log.py` - Activity tracking
- `item.py` - Package item endpoints
- `account_terms_of_service.py` - ToS acceptance

**Staff Endpoints** (staff/)
- `project.py` - Project management
- `submission.py` - Submission review & approval
- `staff_user.py` - Staff user management
- `proponent.py` - Proponent/account management
- `package.py` - Package management
- `internal_document.py` - Internal staff documents
- `item.py` - Item management
- `submitted_document.py` - Document review
- `submission_item_note.py` - Notes on submissions
- `activity_log.py` - Activity tracking

#### Services Layer
- **Authentication**: keycloak.py - Keycloak/OIDC integration
- **Management Plans**: management_plan_service.py - Business logic for management plan submissions
- **Package Versions**: package_version_service.py - Version control
- **Submission Reviews**: submission_review.py - Review workflow
- **Staff Users**: staff_user_service.py - Staff management
- **Proponents**: proponent_service.py - Proponent account management
- **Documents**: submitted_document_service.py, internal_staff_document_service.py
- **Consultation Records**: consultation_record_service.py

#### Data Models
- **User Management**: user.py, staff_user.py, role.py, account_user.py
- **Accounts**: account.py, account_project.py, account_terms_of_service.py
- **Submissions**: submission.py, package.py, package_version.py, item.py
- **Documents**: submitted_document.py, submitted_form.py, internal_staff_document.py
- **Content**: package_type.py, item_type.py, package_item_type.py
- **Tracking**: submission_review.py, activity_log.py, submission_item_note.py, update_request.py
- **Supporting**: invitations.py, email_queue.py, user_status.py

### Frontend Components (React)

#### Layout Components
- **SideNav** - Navigation for both proponents and staff
- **Header** - Top navigation with user profile
- **Layout Providers** - Modal, Drawer, Snackbar providers

#### Feature Components
- **Projects** - Project listing and details (separate views for proponents and staff)
- **Submissions** - Submission creation, editing, and viewing
- **NewManagementPlan** - Guided form for creating management plan submissions
- **SubmissionItem** - Details view with tabs for different submission types
  - ManagementPlanSubmission
  - IEMSubmission (Inspection & Environmental Monitoring)
  - ConsultationRecord
- **Documents** - Document upload/download management
- **FileUpload** - File upload component with drag-and-drop
- **UserManagement** - User and staff management (both admin and profile views)
- **Registration** - Onboarding flow for new proponents
- **UpdateRequestWidget** - Handles update/revision requests

#### Shared Components
- **Forms** - Controlled form components (TextField, RadioGroup, Checkbox, etc.)
- **Filters** - Search and filtering UI
- **StatusChips** - Visual status indicators
- **InfoBox/ContentBox** - Data display containers
- **Modals & Drawers** - Dialog components
- **Typographies** - Text styling components
- **PermissionGate** - Role-based access control

#### Pages/Routes
- Proponent routes: registration, projects, submissions, user management, profile
- Staff routes: projects, submissions, invitations, documents
- Public routes: login, logout, error handling

### Cron Jobs (submit-cron)
- **ENGAGEMENT_PUBLISH** - Scheduled job for engagement publishing
- **Project Metadata Sync** - Periodically syncs project data from Epic.Track

## Project Structure

```
EPIC.submit/
├── README.md                     # Main documentation
├── submit-web/                   # Frontend application
│   ├── src/
│   │   ├── main.tsx             # Application entry point
│   │   ├── App.tsx              # Root component with providers
│   │   ├── router.tsx           # Route configuration
│   │   ├── routes/              # Page components (file-based routing)
│   │   │   ├── proponent/       # Proponent-specific pages
│   │   │   ├── staff/           # Staff-specific pages
│   │   │   └── ...auth routes
│   │   ├── components/          # Reusable React components
│   │   │   ├── Shared/          # Common/shared components
│   │   │   ├── Projects/        # Project management components
│   │   │   ├── Submissions/     # Submission-related components
│   │   │   ├── SubmissionItem/  # Detailed submission views
│   │   │   ├── UserManagement/  # User management components
│   │   │   ├── registration/    # Onboarding components
│   │   │   └── ...other features
│   │   ├── utils/               # Utility functions and helpers
│   │   ├── services/            # API service layer
│   │   ├── stores/              # Zustand state stores
│   │   ├── styles/              # Theme and global styles
│   │   └── hooks/               # Custom React hooks
│   ├── package.json             # Dependencies and scripts
│   └── cypress/                 # E2E tests
│
├── submit-api/                  # Backend Flask application
│   ├── src/
│   │   └── submit_api/
│   │       ├── __init__.py      # Flask app factory
│   │       ├── config.py        # Configuration management
│   │       ├── models/          # SQLAlchemy ORM models
│   │       ├── schemas/         # Marshmallow serialization schemas
│   │       ├── services/        # Business logic layer
│   │       ├── resources/       # Flask-RESTful endpoints
│   │       │   ├── proponent/   # Proponent API routes
│   │       │   ├── staff/       # Staff API routes
│   │       │   ├── apihelper.py # Common API utilities
│   │       │   └── ops.py       # Operations/health check endpoints
│   │       ├── auth/            # Authentication logic
│   │       ├── enums/           # Enumeration definitions
│   │       ├── utils/           # Utility functions
│   │       ├── data_classes/    # Data transfer objects
│   │       └── exceptions/      # Custom exceptions
│   ├── migrations/              # Database migrations (Alembic)
│   ├── tests/                   # Unit tests
│   ├── requirements/            # Python dependencies
│   │   ├── dev.txt             # Development dependencies
│   │   └── prod.txt            # Production dependencies
│   ├── Makefile                # Build and run commands
│   ├── docker-compose.yml      # Local development services
│   ├── Dockerfile              # Container image definition
│   └── setup.py                # Python package configuration
│
├── submit-cron/                # Background job scheduler
│   ├── src/submit_cron/        # Cron job implementations
│   ├── requirements/           # Dependencies
│   ├── Makefile                # Build commands
│   └── run_*.sh                # Job execution scripts
│
├── deployment/                 # Deployment configurations
│   ├── charts/                 # Helm charts for OpenShift
│   ├── docker/                 # Docker configurations
│   └── ...infrastructure files
│
├── docs/                       # Documentation
└── .github/
    └── workflows/             # GitHub Actions CI/CD
```

## Key Features

1. **Role-Based Access Control**: Separate interfaces and permissions for Proponents and Staff
2. **Multi-Step Submission Workflow**: Guided form process for creating submissions
3. **Document Management**: Upload, version, and track documents with S3 integration
4. **Status Tracking**: Real-time submission status updates and activity logs
5. **Collaboration**: Notes, update requests, and revision tracking
6. **Email Notifications**: Automated alerts for status changes
7. **Project Synchronization**: Automatic sync with Epic.Track for project metadata
8. **Authentication**: Keycloak/OIDC integration with JWT tokens
9. **Consultation Records**: Specialized forms for environmental consultation tracking
10. **Compliance Management**: Reference to Epic.Conditions for compliance checks

## Authentication & Security

- **Identity Provider**: Keycloak with OIDC (OpenID Connect)
- **Token Type**: JWT (JSON Web Tokens)
- **Authorization**: Role-based (REALM_ROLES and CLIENT_ROLES)
- **CORS**: Enabled with configurable origins
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Token Validation**: Cached JWKS validation for performance

## Database Schema Highlights

The PostgreSQL database includes tables for:
- **Users & Authentication**: users, staff_users, roles, account_users
- **Accounts & Projects**: accounts, account_projects, projects
- **Submissions**: packages, items, submissions, package_versions
- **Documents**: submitted_documents, submitted_forms, internal_staff_documents
- **Tracking**: submission_reviews, activity_logs, submission_item_notes, update_requests
- **Configuration**: package_types, item_types, package_item_types, invitations
- **Email**: email_queue (for background email processing)

## Summary

EPIC.submit is a comprehensive, enterprise-grade environmental compliance submission management system with a modern tech stack, clear separation of concerns, and well-organized components for managing complex submission workflows between organizations and government agencies.
