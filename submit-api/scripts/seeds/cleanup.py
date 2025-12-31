"""E2E test data cleanup functions using CASCADE DELETE."""

from submit_api.models import User, Account
from submit_api.models.db import db
from submit_api.models.project import Project
from submit_api.models.account_project import AccountProject


def cleanup_test_data(guid: str = None, proponent_id: int = None, project_id: int = None, account_id: int = None):
    """Clean up test data using CASCADE DELETE.

    CRITICAL: Deletion order matters due to foreign key constraints.

    Deletion order:
    1. Account (CASCADE to AccountUser → UserRole, AccountProject → Packages → Items → everything, Invitations)
    2. User (after AccountUser is removed by CASCADE, User can be safely deleted)
    3. Project (only if no remaining AccountProject links)

    Args:
        guid: User GUID to delete (optional)
        proponent_id: Proponent ID to find and delete Account (optional)
        project_id: Project ID to delete if no remaining links (optional)
        account_id: Account ID to delete (optional)
    """
    # Step 1: Delete Account FIRST (CASCADE handles everything)
    account_to_delete = None

    if account_id:
        account_to_delete = Account.query.get(account_id)
        if account_to_delete:
            print(f"Deleting account (ID: {account_id})")

    elif proponent_id:
        account_to_delete = Account.get_by_proponent_id(proponent_id)
        if account_to_delete:
            print(f"Deleting account (proponent_id: {proponent_id}, account_id: {account_to_delete.id})")

    if account_to_delete:
        db.session.delete(account_to_delete)
        print("  ✓ Deleted account → CASCADE removed:")
        print("    - AccountUser → UserRole")
        print("    - AccountProject → Package → Item → Submission/Review/Note hierarchy")
        print("    - Invitations")
        # Commit immediately so CASCADE happens and AccountUser is removed
        db.session.commit()

    # Step 2: Delete User AFTER Account (AccountUser was removed by CASCADE)
    if guid:
        user = User.get_by_guid(guid)
        if user:
            print(f"Deleting user (GUID: {guid})")
            db.session.delete(user)
            print(f"  ✓ Deleted user (ID: {user.id})")

    # Step 3: Delete Project (only if no remaining AccountProject links)
    if project_id:
        # AccountProject CASCADE already happened above if we deleted Account
        remaining_links = AccountProject.query.filter_by(project_id=project_id).count()

        if remaining_links == 0:
            project = Project.query.filter_by(id=project_id).first()
            if project:
                print(f"Deleting project (ID: {project_id})")
                db.session.delete(project)
                print(f"  ✓ Deleted project (ID: {project.id})")
        else:
            print(f"  ℹ Skipping project deletion (ID: {project_id}) - has {remaining_links} remaining account link(s)")

    # Final commit
    db.session.commit()
    print("  ✓ Cleanup committed to database")
