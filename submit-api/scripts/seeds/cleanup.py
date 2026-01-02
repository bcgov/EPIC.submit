"""E2E test data cleanup functions using CASCADE DELETE."""

from submit_api.models import User, Account
from submit_api.models.db import db
from submit_api.models.project import Project
from submit_api.models.account_project import AccountProject
from submit_api.models.package_version import PackageVersion
from submit_api.models.package import Package


def _cleanup_package_versions(account_id: int):
    """Delete PackageVersions associated with an Account's Packages.

    This must run BEFORE Account deletion to avoid orphaned PackageVersions.

    PackageVersions are not automatically cleaned up by CASCADE DELETE because:
    - Package.version_id has NO ondelete='CASCADE' parameter
    - PackageVersion.original_package_id is NOT a ForeignKey (just an integer)

    Args:
        account_id: Account ID whose PackageVersions should be deleted
    """
    print("  Cleaning up PackageVersions...")

    # 1. Find all AccountProjects for this Account
    account_project_ids = [
        ap.id for ap in db.session.query(AccountProject.id).filter_by(account_id=account_id).all()
    ]

    if not account_project_ids:
        print("    ℹ No AccountProjects found, skipping PackageVersion cleanup")
        return

    print(f"    - Found {len(account_project_ids)} AccountProject(s)")

    # 2. Find all Packages for these AccountProjects
    packages = db.session.query(Package).filter(
        Package.account_project_id.in_(account_project_ids)
    ).all()

    if not packages:
        print("    ℹ No Packages found, skipping PackageVersion cleanup")
        return

    package_ids = [p.id for p in packages]
    print(f"    - Found {len(package_ids)} Package(s)")

    # 3. Collect all PackageVersion IDs to delete (from two sources)
    version_ids_set = set()

    # 3a. PackageVersions directly referenced by Package.version_id
    for package in packages:
        if package.version_id:
            version_ids_set.add(package.version_id)

    # 3b. PackageVersions where original_package_id matches our Packages
    version_ids_by_original = db.session.query(PackageVersion.id).filter(
        PackageVersion.original_package_id.in_(package_ids)
    ).all()

    for vid in version_ids_by_original:
        version_ids_set.add(vid[0])

    if not version_ids_set:
        print("    ℹ No PackageVersions found, skipping cleanup")
        return

    all_version_ids = list(version_ids_set)
    print(f"    - Found {len(all_version_ids)} PackageVersion(s) to delete")

    # 4. NULL out Package.version_id to break FK constraint
    updated_count = db.session.query(Package).filter(
        Package.id.in_(package_ids),
        Package.version_id.isnot(None)
    ).update({Package.version_id: None}, synchronize_session=False)

    print(f"    ✓ Nulled Package.version_id for {updated_count} package(s)")

    # 5. Delete PackageVersions
    deleted_count = db.session.query(PackageVersion).filter(
        PackageVersion.id.in_(all_version_ids)
    ).delete(synchronize_session=False)

    print(f"    ✓ Deleted {deleted_count} PackageVersion(s)")

    # 6. Commit PackageVersion cleanup before Account deletion
    db.session.commit()
    print("    ✓ PackageVersion cleanup committed")


def cleanup_test_data(guid: str = None, proponent_id: int = None, project_id: int = None, account_id: int = None):
    """Clean up test data using CASCADE DELETE with explicit PackageVersion cleanup.

    CRITICAL: Deletion order matters due to foreign key constraints.

    Deletion order:
    0. PackageVersions (explicit cleanup - not handled by CASCADE)
    1. Account (CASCADE to AccountUser → UserRole, AccountProject → Packages → Items → everything, Invitations)
    2. User (after AccountUser is removed by CASCADE, User can be safely deleted)
    3. Project (only if no remaining AccountProject links)

    Note: PackageVersions require explicit cleanup because Package.version_id has no
    ondelete='CASCADE' and PackageVersion.original_package_id is not a ForeignKey.

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
        # CRITICAL: Clean up PackageVersions BEFORE deleting Account
        # PackageVersions are not cleaned up by CASCADE DELETE because:
        # - Package.version_id has NO ondelete='CASCADE'
        # - PackageVersion.original_package_id is NOT a ForeignKey
        _cleanup_package_versions(account_to_delete.id)

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
