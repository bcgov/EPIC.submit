# AccountProject Creation Refactor

## Summary
Refactored the invitation workflow to create `AccountProject` entries during invitation **acceptance** rather than during invitation **generation**.

## Changes Made

### 1. InvitationService (`submit-api/src/submit_api/services/invitation_service.py`)

#### Removed AccountProject creation from invitation generation
- **Method**: `_get_or_create_account_by_proponent()` (lines 284-290)
- **Change**: Removed the call to `_create_account_projects()` 
- **Reason**: AccountProjects should only exist when someone has actually onboarded

#### Added AccountProject creation to invitation acceptance
- **Method**: `accept_invitation()` (lines 203-205)
- **Change**: Added call to `_create_account_projects()` before retrieving account projects
- **Reason**: Creates the account-project relationship when user actually accepts the invitation
- **Concurrency**: The existing `create_account_project()` method already handles duplicates gracefully by checking for existing records

#### Updated authorization checks
- **Method**: `_check_action_authorized()` (lines 65-68)
- **Change**: Added early return when no AccountProjects exist yet
- **Reason**: New entity invitations won't have AccountProjects until accepted, so permission checks are handled by staff role authorization at the API endpoint level

### 2. Database Migration
- **File**: `migrations/versions/a1b2c3d4e5f6_add_unique_constraint_account_projects.py`
- **Change**: Added unique constraint on `(account_id, project_id)` in `account_projects` table
- **Reason**: Prevents duplicate account-project relationships when multiple invitations are accepted concurrently

## Benefits

1. **Accurate Data Model**: AccountProject existence now truly represents onboarded status
2. **Solves UI Issue**: Can now distinguish between invited vs onboarded projects
3. **Concurrent Safety**: Database-level unique constraint prevents duplicates
4. **Cleaner Logic**: No need for status tracking on AccountProject - existence IS the status

## Impact Analysis

### Existing Flows
- **New Entity Invitation** (`generate_new_entity_account_invitation`): No longer creates AccountProjects
- **Existing Account Invitation** (`invite_user_to_project`): No change - expects AccountProjects to already exist
- **Accept Invitation** (`accept_invitation`): Now creates AccountProjects before assigning roles
- **Revoke/Resend/Get Invitation**: Authorization updated to handle invitations without AccountProjects

### Testing Considerations
- Tests that create new entity invitations should verify AccountProjects are NOT created
- Tests that accept invitations should verify AccountProjects ARE created
- Tests for concurrent invitation acceptance should verify unique constraint works

## Migration Steps

1. Apply database migration to add unique constraint
2. Deploy code changes
3. No data migration needed - existing AccountProjects remain valid
