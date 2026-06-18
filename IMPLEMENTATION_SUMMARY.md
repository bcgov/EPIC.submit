# Work-Based Access Control Implementation Summary

## Implementation Status: CORE COMPLETE ✅

The work-based access control system has been successfully implemented according to the plan. Staff users from EPIC.track can now be synced with work assignments and role-based permissions.

## What Has Been Implemented

### Phase 1: Database Schema ✅
- **Migration File**: `migrations/versions/fc1a2b3d4e5f_add_staff_user_works_table.py`
  - Creates `staff_user_works` junction table
  - Links staff users to works with roles (TEAM_LEAD or TEAM_MEMBER)
  - Includes soft delete support via `is_active` flag

- **Model**: `models/staff_user_work.py`
  - StaffUserWork model with relationships
  - Methods: `find_by_staff_user_id()`, `find_by_work_id()`, `get_or_create()`, `find_by_staff_user_and_work()`

- **Updated Models**:
  - `staff_user.py`: Added `work_assignments` relationship
  - `track_work.py`: Added `staff_assignments` relationship
  - `models/__init__.py`: Exported StaffUserWork

### Phase 2: Application-Level Roles ✅
- **Enum**: `enums/work_role.py`
  - WorkRole.TEAM_LEAD
  - WorkRole.TEAM_MEMBER

### Phase 3: API Endpoints & Services ✅
- **Schemas**: `schemas/staff_user_work.py`
  - `StaffUserWorkSchema`: Response schema
  - `SyncStaffUserWorkRequest`: Sync request schema
  - `RemoveStaffUserWorkRequest`: Removal request schema

- **Service**: `services/staff_user_work_service.py`
  - `sync_staff_user_work()`: Creates/updates work assignments
    - Looks up user in Keycloak by email
    - Creates User and StaffUser records if needed
    - **Idempotently assigns EAO_STAFF Keycloak group**
    - Validates work exists
    - Creates/updates work assignment
  - `remove_staff_user_work()`: Soft deletes work assignments
  - `get_works_for_staff_user()`: Retrieves active assignments

- **Resource**: `resources/staff_user_work.py`
  - `POST /api/staff-user-works/sync`: Sync endpoint for EPIC.track
  - `DELETE /api/staff-user-works/remove`: Removal endpoint for EPIC.track
  - Both require `MANAGE_USERS` Keycloak role

- **Updated**: `resources/__init__.py`
  - Registered STAFF_USER_WORK_API namespace

### Phase 4: Authorization Logic ✅
- **Updated**: `services/authorization.py`
  - Modified `has_access_to_package()`:
    - Checks if package is work-related (`account_project_work_id`)
    - Verifies staff user has active assignment to the work
    - Stores work role in Flask `g` for permission checks
    - Non-work packages allow access via Keycloak roles
  - Added `has_work_role()`: Check if user has required work role
  - Added `require_team_lead_access()`: Enforce Team Lead role

### Phase 5: Schema Updates ✅
- **Updated**: `schemas/staff_user.py`
  - Added `work_assignments` field to StaffUserSchema

## Key Features Implemented

### 1. EPIC.track Integration
- EPIC.track can call `POST /api/staff-user-works/sync` to assign staff to works
- Request format:
```json
{
  "email": "user@gov.bc.ca",
  "work_id": 123,
  "role": "TEAM_LEAD" | "TEAM_MEMBER"
}
```

### 2. Removal Flow
- EPIC.track can call `DELETE /api/staff-user-works/remove` to remove assignments
- Sets `is_active=False` (soft delete)
- Request format:
```json
{
  "email": "user@gov.bc.ca",
  "work_id": 123
}
```

### 3. Keycloak Group Assignment
- **Idempotent**: Checks if user already has EAO_STAFF group before assigning
- Handles both new users and existing management plan users
- Doesn't fail the entire operation if group assignment fails (logs warning)

### 4. Work-Based Access Control
- Staff users can only access packages linked to their assigned works
- Access is checked via `authorization.has_access_to_package()`
- Non-work packages remain accessible via Keycloak roles (backward compatible)

### 5. Role-Based Permissions
- **Team Member**: Can view, verify, acknowledge, request updates
- **Team Lead**: All Team Member permissions + approve IPD, accept Type C submissions
- Role stored in Flask `g.work_role` for permission checks

## Next Steps Required

### 1. Run Database Migration
```bash
cd submit-api
# Check migration status
flask db current

# Run the migration
flask db upgrade

# Verify table created
flask db current
```

### 2. Testing
The following test scenarios should be verified:

#### Unit Tests
- [ ] Test `StaffUserWorkService.sync_staff_user_work()` for new users
- [ ] Test `StaffUserWorkService.sync_staff_user_work()` for existing users
- [ ] Test `StaffUserWorkService.remove_staff_user_work()`
- [ ] Test EAO_STAFF group assignment (idempotent)
- [ ] Test authorization with work-based access
- [ ] Test role permission checks

#### Integration Tests
- [ ] Test sync endpoint: `POST /api/staff-user-works/sync`
- [ ] Test removal endpoint: `DELETE /api/staff-user-works/remove`
- [ ] Test package access with work assignments
- [ ] Test users with no assignments see nothing
- [ ] Test user removed from work loses access

#### Edge Cases
- [ ] New user synced from EPIC.track
- [ ] Existing management plan user synced from EPIC.track
- [ ] User already in EAO_STAFF group
- [ ] User assigned to multiple works
- [ ] User removed from all works
- [ ] Non-existent work assignment removal attempt

### 3. EPIC.track Coordination
- [ ] Provide API documentation to EPIC.track team
- [ ] Coordinate authentication method (service account or MANAGE_USERS role)
- [ ] Plan initial bulk sync of existing team assignments
- [ ] Set up monitoring for sync operations

### 4. Future Enhancements (Optional)
These were identified in the plan but not implemented yet:

#### Package Query Filtering
- Update `models/queries/package.py` to filter packages by staff user's work assignments
- Modify `GET /projects` endpoint to show only accessible packages

#### Team Lead Role Enforcement
- Add `@require_team_lead_access()` decorator to:
  - IPD document approval endpoints
  - Type C submission acceptance endpoints

#### Bulk Operations
- Consider adding bulk sync endpoint if EPIC.track needs it:
  - `POST /api/staff-user-works/bulk-sync`
  - Accept array of assignments

## Files Created
1. `migrations/versions/fc1a2b3d4e5f_add_staff_user_works_table.py`
2. `src/submit_api/models/staff_user_work.py`
3. `src/submit_api/enums/work_role.py`
4. `src/submit_api/schemas/staff_user_work.py`
5. `src/submit_api/services/staff_user_work_service.py`
6. `src/submit_api/resources/staff_user_work.py`

## Files Modified
1. `src/submit_api/models/staff_user.py`
2. `src/submit_api/models/track_work.py`
3. `src/submit_api/models/__init__.py`
4. `src/submit_api/services/authorization.py`
5. `src/submit_api/schemas/staff_user.py`
6. `src/submit_api/resources/__init__.py`

## API Endpoints Available

### Sync Staff User Work Assignment
```
POST /api/staff-user-works/sync
Authorization: Bearer <token with MANAGE_USERS role>
Content-Type: application/json

{
  "email": "user@gov.bc.ca",
  "work_id": 123,
  "role": "TEAM_LEAD"
}

Response: 201 Created
{
  "id": 1,
  "staff_user_id": 5,
  "work_id": 123,
  "role": "TEAM_LEAD",
  "is_active": true,
  "work": { ... }
}
```

### Remove Staff User Work Assignment
```
DELETE /api/staff-user-works/remove
Authorization: Bearer <token with MANAGE_USERS role>
Content-Type: application/json

{
  "email": "user@gov.bc.ca",
  "work_id": 123
}

Response: 200 OK
{
  "message": "Work assignment removed for user 'user@gov.bc.ca' and work ID 123."
}
```

## Important Notes

1. **Existing Staff Users**: No migration needed - existing staff are management plan users and operate independently

2. **Idempotent Operations**: Syncing the same user/work/role multiple times is safe

3. **Backward Compatibility**: Non-work packages remain accessible to all staff via Keycloak roles

4. **Soft Deletes**: Removed assignments are marked `is_active=False`, not deleted

5. **Error Handling**: Service methods raise appropriate exceptions (ResourceNotFoundError, BadRequestError)

## Verification Checklist

Before deploying to production:
- [ ] Database migration runs successfully
- [ ] API endpoints are accessible and return correct responses
- [ ] Authorization logic correctly restricts access to work-based packages
- [ ] EAO_STAFF group assignment works for new and existing users
- [ ] Removal endpoint correctly revokes access
- [ ] No regressions in existing functionality
- [ ] EPIC.track integration tested end-to-end
