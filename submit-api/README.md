# SUBMIT-API

A submit Python flask API application to be used as a template.

## Getting Started

### Development Environment
* Install the following:
    - [Python](https://www.python.org/)
    - [Docker](https://www.docker.com/)
    - [Docker-Compose](https://docs.docker.com/compose/install/)
* Install Dependencies
    - Run `make setup` in the root of the project (submit-api)
* Start the databases
    - Run `docker-compose up` in the root of the project (submit-api)

## Environment Variables

The development scripts for this application allow customization via an environment file in the root directory called `.env`. See an example of the environment variables that can be overridden in `sample.env`.

## Commands

### Development

The following commands support various development scenarios and needs.
Before running the following commands run `. venv/bin/activate` to enter into the virtual env.


> `make run`
>
> Runs the python application and runs database migrations.  
Open [http://localhost:5000/api](http://localhost:5000/api) to view it in the browser.<br/>
> The page will reload if you make edits.<br/>
> You will also see any lint errors in the console.

> `make test`
>
> Runs the application unit tests<br>

> `make lint`
>
> Lints the application code.

## Debugging in the Editor

### Visual Studio Code

Ensure the latest version of [VS Code](https://code.visualstudio.com) is installed.

The [`launch.json`](.vscode/launch.json) is already configured with a launch task (SUBMIT-API Launch) that allows you to launch chrome in a debugging capacity and debug through code within the editor. 

## Documentation

- [Database Design: Works Integration](../docs/database-design-works-integration.md) - Database schema for integrating Works, Phases, and work-specific packages from EPIC.track

## API Endpoints

### Staff API: Package Type Management

#### Create or Update Package Type

**Endpoint:** `POST /api/staff/package-types`

**Description:** Creates or updates a package type with phase association. This endpoint is **idempotent** - it will create a new package type if it doesn't exist, or update the existing one if it does.

**Authentication:** Staff users only

**How it Works:**
1. The endpoint identifies the phase using three parameters:
   - `ea_act_name`: Environmental Assessment Act name
   - `work_type_name`: Work Type name
   - `phase_name`: Phase name (matches either `display_name` or `name` in the database)
2. Once the phase is found, it creates or updates a package type and associates it with the specified item types
3. Item types are associated in the order provided, with `sort_order` automatically assigned

**Request Body:**
```json
{
  "ea_act_name": "EA Act (2018)",
  "work_type_name": "Assessment",
  "phase_name": "Early Engagement",
  "package_type_name": "IPD",
  "item_types": [
    {"id": 1},
    {"id": 2},
    {"name": "Custom Document", "submission_method": "DOCUMENT_UPLOAD"}
  ]
}
```

**Request Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `ea_act_name` | string | Yes | Environmental Assessment Act name | `"EA Act (2018)"` |
| `work_type_name` | string | Yes | Work type name from EPIC.track | `"Assessment"` |
| `phase_name` | string | Yes | Phase name (display name or actual name) | `"Early Engagement"` |
| `package_type_name` | string | Yes | Name for the package type to create/update | `"IPD"` |
| `item_types` | array[object] | Yes | List of item types (existing IDs or new definitions) | See below |

**Valid EA Act Names:**
- `"EA Act (1996)"` (ID: 1)
- `"EA Act (2002)"` (ID: 2)
- `"EA Act (2018)"` (ID: 3)
- `"Other"` (ID: 4)

**Valid Work Type Names:**
- `"Project Notification"` (ID: 1)
- `"Minister's Designation"` (ID: 2)
- `"CEAO's Designation"` (ID: 3)
- `"Intake (Pre-EA)"` (ID: 4)
- `"Exemption Order"` (ID: 5)
- `"Assessment"` (ID: 6)
- `"Amendment"` (ID: 7)
- `"Post-EAC Document Review"` (ID: 8)
- `"EAC Extension"` (ID: 9)
- `"Substantial Start Determination"` (ID: 10)
- `"EAC/Order Transfer"` (ID: 11)
- `"EAC/Order Suspension"` (ID: 12)
- `"EAC/Order Cancellation"` (ID: 13)
- `"Other"` (ID: 14)
- `"Material Alteration"` (ID: 15)

**Item Types Format:**

Each item in the `item_types` array can be specified in two ways:

1. **Existing Item Type (by ID):**
```json
{"id": 1}
```

2. **New Item Type (by name and submission method):**
```json
{
  "name": "Custom Document Type",
  "submission_method": "DOCUMENT_UPLOAD"  // or "FORM_SUBMISSION"
}
```

**Valid Submission Methods:**
- `"DOCUMENT_UPLOAD"` - Item requires document upload
- `"FORM_SUBMISSION"` - Item uses form-based submission

**Example Phase Names (for Assessment work type):**
- `"Pre-EA (EAC Assessment)"`
- `"Early Engagement"`
- `"DPD Development (Proponent Time)"`
- `"Process Planning"`
- `"EAC Application Development (Proponent Time)"`
- `"EAC Application Review"`
- `"Effects Assessment & Recommendation"`
- `"EAC Decision"`

**Success Response (200 OK):**
```json
{
  "id": 5,
  "name": "IPD",
  "phase_id": 10,
  "phase_name": "Early Engagement",
  "ea_act_name": "EA Act (2018)",
  "work_type_name": "Assessment",
  "item_type_ids": [1, 2, 5],
  "created_item_types": [
    {
      "id": 5,
      "name": "Custom Document",
      "submission_method": "DOCUMENT_UPLOAD"
    }
  ],
  "created": true
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Package type ID (database primary key) |
| `name` | string | Package type name |
| `phase_id` | integer | Associated phase ID from `track_phases` table |
| `phase_name` | string | Display name of the phase |
| `ea_act_name` | string | Environmental Assessment Act name |
| `work_type_name` | string | Work type name |
| `item_type_ids` | array[int] | List of all associated item type IDs |
| `created_item_types` | array[object] | List of newly created item types (empty if all existed) |
| `created` | boolean | `true` if package type newly created, `false` if updated |

**Error Responses:**

**400 Bad Request** - Validation error
```json
{
  "message": "Validation error",
  "errors": {
    "item_types": ["item_types must contain at least one item type"]
  }
}
```

Or for invalid item type definition:
```json
{
  "message": "Validation error",
  "errors": {
    "item_types": {
      "0": {
        "_schema": ["Must provide either id OR both name and submission_method"]
      }
    }
  }
}
```

**404 Not Found** - Phase or item types not found
```json
{
  "message": "Phase not found for EA Act: 'EA Act (2018)', Work Type: 'Assessment', Phase: 'Invalid Phase'"
}
```

Or for invalid item type ID:
```json
{
  "message": "An error occurred while creating/updating the package type",
  "error": "Item type with ID 999 not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "message": "An error occurred while creating/updating the package type",
  "error": "Error details..."
}
```

**Usage Examples:**

**Example 1: Create a new package type using existing item types**
```bash
curl -X POST http://localhost:5000/api/staff/package-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ea_act_name": "EA Act (2018)",
    "work_type_name": "Assessment",
    "phase_name": "Early Engagement",
    "package_type_name": "IPD",
    "item_types": [{"id": 1}, {"id": 2}, {"id": 3}]
  }'
```

**Example 2: Create package type with mixed item types (existing + new)**
```bash
curl -X POST http://localhost:5000/api/staff/package-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ea_act_name": "EA Act (2018)",
    "work_type_name": "Assessment",
    "phase_name": "Early Engagement",
    "package_type_name": "IPD",
    "item_types": [
      {"id": 1},
      {"id": 2},
      {"name": "Environmental Impact Assessment", "submission_method": "DOCUMENT_UPLOAD"}
    ]
  }'
```

**Example 3: Create IPD package type for Early Engagement (real-world example)**
```bash
curl -X POST http://localhost:5000/api/staff/package-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ea_act_name": "EA Act (2018)",
    "work_type_name": "Assessment",
    "phase_name": "Early Engagement",
    "package_type_name": "IPD",
    "item_types": [
      {
        "name": "Initial Project Description",
        "submission_method": "DOCUMENT_UPLOAD"
      },
      {
        "name": "Engagement Plan",
        "submission_method": "DOCUMENT_UPLOAD"
      },
      {
        "name": "Geospatial Information",
        "submission_method": "DOCUMENT_UPLOAD"
      },
      {
        "name": "Early Engagement Proponent Checklist",
        "submission_method": "FORM_SUBMISSION"
      }
    ]
  }'
```

**Important Notes:**

1. **Idempotency**: Running the same request multiple times will update the existing package type rather than creating duplicates
2. **Phase Matching**: The phase is matched by `ea_act_name`, `work_type_name`, and `phase_name`. The `phase_name` can match either the `display_name` or `name` field in the database
3. **Item Type Creation**: New item types are created automatically if they don't exist. If an item type with the same name already exists, the existing one will be reused
4. **Item Type Order**: Item types are associated in the order provided in the `item_types` array, with `sort_order` starting from 1
5. **Existing Associations**: When updating, all existing item type associations are removed and replaced with the new ones
6. **Phase Data**: Phase data must exist in the `track_phases` table before creating package types. See the [Database Design documentation](../docs/database-design-works-integration.md) for phase data structure

**Related Enums:**

The following enums are available in the codebase for reference:

- `EAActName` (`src/submit_api/enums/ea_act.py`) - Environmental Assessment Act names
- `WorkTypeName` (`src/submit_api/enums/work_type.py`) - Work type names

**Swagger Documentation:**

Interactive API documentation is available at:
- Development: `http://localhost:5000/api/staff/`
- The Swagger UI provides a complete list of available phases and item types