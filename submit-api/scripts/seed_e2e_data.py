#!/usr/bin/env python3
"""Seed E2E test data for Playwright tests.

This module provides reusable functions to seed test data directly using SQLAlchemy models.
"""
import sys
import os

# Add src to path so we can import submit_api modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from submit_api import create_app
from submit_api.models import User, Account, AccountUser, UserRole, Role
from submit_api.models.db import db
from submit_api.models.user import UserType
from submit_api.models.account_terms_of_service import TermsOfService
from submit_api.models.project import Project
from submit_api.models.account_project import AccountProject


def seed_proponent_user(
    guid: str,
    account_id: int,
    first_name: str = "E2E",
    last_name: str = "Proponent",
    position: str = "Test Administrator",
    work_email: str = "e2e.proponent@test.example.com",
    work_phone: str = "555-0100",
    extension: str = "101",
    role_name: str = "PROJECT_ADMIN",
    accept_terms_of_service: bool = True,
    account_project_id: int = None
) -> tuple:
    """Seed a proponent user (User + AccountUser + UserRole).

    Args:
        guid: The auth_guid for the user (from Keycloak)
        account_id: ID of the account to add user to (REQUIRED)
        first_name: User's first name
        last_name: User's last name
        position: User's position/title
        work_email: User's work email address
        work_phone: User's work phone number
        extension: Phone extension (optional)
        role_name: Role to assign (default: PROJECT_ADMIN)
        accept_terms_of_service: Whether to accept terms of service (default: True)
        account_project_id: AccountProject ID for project-specific role, None for account-wide (default: None)

    Returns:
        tuple: (user, account_user, user_role)
    """
    print(f"Creating proponent user with GUID: {guid}")

    # Check if user already exists
    existing_user = User.get_by_guid(guid)
    if existing_user:
        print(f"  ℹ User already exists (ID: {existing_user.id})")
        existing_account_user = AccountUser.get_by_guid(guid)
        if existing_account_user:
            print(f"  ℹ Account user already exists (ID: {existing_account_user.id})")
            return existing_user, existing_account_user, existing_account_user.role

    # Create user
    user = User.create_user({
        'auth_guid': guid,
        'type': UserType.PROPONENT
    })
    print(f"  ✓ Created user (ID: {user.id})")

    # Fetch account (must exist)
    account = Account.query.get(account_id)
    if not account:
        raise ValueError(f"Account with ID {account_id} not found")

    # Get or create active terms of service (if accepting)
    terms_of_service_version = None
    if accept_terms_of_service:
        terms_of_service = TermsOfService.get_active_terms_of_service()
        if not terms_of_service:
            # Create a default terms of service for E2E testing
            terms_of_service = TermsOfService.create_terms_of_service({
                'version': 1,
                'content': 'E2E Test Terms of Service',
                'active': True
            })
            print(f"  ✓ Created terms of service (version: {terms_of_service.version})")
        else:
            print(f"  ℹ Using existing terms of service (version: {terms_of_service.version})")
        terms_of_service_version = terms_of_service.version

    # Create account user
    account_user_data = {
        'user_id': user.id,
        'account_id': account.id,
        'first_name': first_name,
        'last_name': last_name,
        'position': position,
        'work_email_address': work_email,
        'work_contact_number': work_phone,
        'extension_number': extension
    }

    if terms_of_service_version:
        account_user_data['terms_of_service_version_id'] = terms_of_service_version

    account_user = AccountUser.create_account_user(account_user_data)

    if accept_terms_of_service:
        print(f"  ✓ Created account user (ID: {account_user.id}, accepted ToS: version {terms_of_service_version})")
    else:
        print(f"  ✓ Created account user (ID: {account_user.id}, no ToS acceptance)")

    # Get role
    role = Role.get_by_name(role_name)
    if not role:
        raise ValueError(f"Role '{role_name}' not found in database")

    # Create user role
    user_role = UserRole.create_user_role({
        'account_user_id': account_user.id,
        'account_project_id': account_project_id,  # None for account-wide, ID for project-specific
        'package_ids': None,  # NULL for project-wide role
        'role_id': role.id
    })
    role_scope = f"project {account_project_id}" if account_project_id else "account-wide"
    print(f"  ✓ Created user role (ID: {user_role.id}, role: {role_name}, scope: {role_scope})")

    db.session.commit()
    print(f"  ✓ Committed to database")

    return user, account_user, user_role


def seed_staff_user(
    guid: str,
    first_name: str = "E2E",
    last_name: str = "Staff",
    work_email: str = "e2e.staff@test.example.com"
) -> tuple:
    """Seed a staff user.

    Args:
        guid: The auth_guid for the user (from Keycloak)
        first_name: User's first name
        last_name: User's last name
        work_email: User's work email address

    Returns:
        tuple: (user, staff_user)
    """
    from submit_api.models.staff_user import StaffUser

    print(f"Creating staff user with GUID: {guid}")

    # Check if user already exists
    existing_user = User.get_by_guid(guid)
    if existing_user:
        print(f"  ℹ User already exists (ID: {existing_user.id})")
        return existing_user, None

    # Create user
    user = User.create_user({
        'auth_guid': guid,
        'type': UserType.STAFF
    })
    print(f"  ✓ Created user (ID: {user.id})")

    # Create staff user
    staff_user = StaffUser(
        user_id=user.id,
        first_name=first_name,
        last_name=last_name,
        work_email_address=work_email
    )
    staff_user.save()
    print(f"  ✓ Created staff user (ID: {staff_user.id})")

    db.session.commit()
    print(f"  ✓ Committed to database")

    return user, staff_user


def seed_account(
    proponent_id: int = 8888,
    account_id: int = None
) -> Account:
    """Seed an account for a proponent organization.

    Args:
        proponent_id: Unique proponent ID
        account_id: Optional explicit account ID (for idempotency)

    Returns:
        Account: The created or existing account
    """
    print(f"Creating account for proponent_id: {proponent_id}")

    # Check if account already exists
    existing_account = Account.get_by_proponent_id(proponent_id)
    if existing_account:
        print(f"  ℹ Account already exists (ID: {existing_account.id})")
        return existing_account

    # Create account
    if account_id:
        account = Account(id=account_id, proponent_id=proponent_id)
        db.session.add(account)
    else:
        account = Account.create_account({'proponent_id': proponent_id})

    db.session.commit()
    print(f"  ✓ Created account (ID: {account.id}, proponent_id: {proponent_id})")

    return account


def seed_project(
    project_id: int = 9999,
    name: str = "E2E Test Project",
    proponent_id: int = 8888,
    proponent_name: str = "E2E Test Proponent Inc.",
    ea_certificate: str = "E2E-2024-01",
    epic_guid: str = "588511d4aaecd9001b82656c",
    has_approved_condition: bool = True
) -> Project:
    """Seed a project for E2E testing.

    Args:
        project_id: Unique project ID (for idempotency)
        name: Project name
        proponent_id: Proponent ID (must match account proponent_id)
        proponent_name: Proponent company name
        ea_certificate: EA Certificate number
        epic_guid: EPIC GUID for the project
        has_approved_condition: Whether project has approved conditions

    Returns:
        Project: The created or existing project
    """
    print(f"Creating project: {name} (ID: {project_id})")

    # Check if project already exists
    existing_project = Project.query.filter_by(id=project_id).first()
    if existing_project:
        print(f"  ℹ Project already exists (ID: {existing_project.id})")
        return existing_project

    # Create project
    project = Project(
        id=project_id,
        name=name,
        proponent_id=proponent_id,
        proponent_name=proponent_name,
        ea_certificate=ea_certificate,
        epic_guid=epic_guid,
        has_approved_condition=has_approved_condition
    )
    db.session.add(project)
    db.session.commit()
    print(f"  ✓ Created project (ID: {project.id})")

    return project


def seed_account_project(
    account_id: int,
    project_id: int,
    account_project_id: int = 7777
) -> AccountProject:
    """Link an account to a project.

    Args:
        account_id: Account ID
        project_id: Project ID
        account_project_id: Explicit ID for AccountProject (for predictability)

    Returns:
        AccountProject: The created or existing account-project link
    """
    print(f"Linking account {account_id} to project {project_id}")

    # Check if link already exists
    existing_link = AccountProject.query.filter_by(
        account_id=account_id,
        project_id=project_id
    ).first()

    if existing_link:
        print(f"  ℹ Account-project link already exists (ID: {existing_link.id})")
        return existing_link

    # Check if specific ID exists
    existing_by_id = AccountProject.query.filter_by(id=account_project_id).first()
    if existing_by_id:
        print(f"  ℹ AccountProject ID {account_project_id} already exists, using auto-increment")
        account_project_id = None  # Let database auto-increment

    # Create link
    if account_project_id:
        account_project = AccountProject(
            id=account_project_id,
            account_id=account_id,
            project_id=project_id
        )
    else:
        account_project = AccountProject(
            account_id=account_id,
            project_id=project_id
        )

    db.session.add(account_project)
    db.session.commit()
    print(f"  ✓ Created account-project link (ID: {account_project.id})")

    return account_project


def seed_proponent_with_project(
    guid: str,
    proponent_id: int = 8888,
    account_id: int = None,
    project_id: int = 9999,
    account_project_id: int = 7777,
    project_name: str = "Coastal GasLink Pipeline",
    **kwargs
) -> tuple:
    """Seed complete proponent + project setup.

    Logical flow:
    1. Create Account for proponent organization
    2. Create Project
    3. Link Account to Project via AccountProject
    4. Add User to Account with project-specific role

    Args:
        guid: User GUID
        proponent_id: Proponent ID for account
        account_id: Optional explicit account ID (for idempotency)
        project_id: Project ID
        account_project_id: AccountProject ID (hardcoded for predictability)
        project_name: Name of the project
        **kwargs: Additional options for seed_proponent_user

    Returns:
        tuple: (user, account, account_user, user_role, project, account_project)
    """
    print("=" * 60)
    print(f"Seeding complete proponent setup with project")
    print("=" * 60)

    # 1. Create Account
    account = seed_account(proponent_id=proponent_id, account_id=account_id)

    # 2. Create Project
    project = seed_project(
        project_id=project_id,
        name=project_name,
        proponent_id=proponent_id,
        proponent_name=f"Proponent {proponent_id}"
    )

    # 3. Link Account to Project
    account_project = seed_account_project(
        account_id=account.id,
        project_id=project.id,
        account_project_id=account_project_id
    )

    # 4. Add User to Account
    user, account_user, user_role = seed_proponent_user(
        guid=guid,
        account_id=account.id,
        account_project_id=account_project_id,
        **kwargs
    )

    print()
    print("=" * 60)
    print("✓ Complete proponent setup seeded successfully!")
    print(f"  - Account: {account.id}")
    print(f"  - Project: {project.id}")
    print(f"  - AccountProject: {account_project.id}")
    print(f"  - User: {user.id}")
    print("=" * 60)

    return user, account, account_user, user_role, project, account_project


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


def main():
    """Main entry point for seeding E2E test data."""
    import argparse

    parser = argparse.ArgumentParser(description='Seed E2E test data')

    # Seeding arguments
    parser.add_argument('--guid', type=str, help='User GUID')
    parser.add_argument('--proponent-id', type=int, default=8888, help='Proponent ID')
    parser.add_argument('--first-name', type=str, default='E2E', help='First name')
    parser.add_argument('--last-name', type=str, default='Proponent', help='Last name')
    parser.add_argument('--position', type=str, default='Test Administrator', help='Position/title')
    parser.add_argument('--work-email', type=str, default='e2e.proponent@test.example.com', help='Work email')
    parser.add_argument('--work-phone', type=str, default='555-0100', help='Work phone')
    parser.add_argument('--extension', type=str, default='101', help='Phone extension')
    parser.add_argument('--role', type=str, default='PROJECT_ADMIN', help='Role name')
    parser.add_argument('--no-terms-of-service', action='store_true', help='Do not accept terms of service (default: accept ToS)')

    # Account seeding arguments
    parser.add_argument('--account-only', action='store_true', help='Seed only account (no user)')
    parser.add_argument('--account-id', type=int, help='Explicit account ID (for idempotency)')
    parser.add_argument('--account-id-for-user', type=int, help='Account ID to add user to (required when not using --with-project)')

    # Project seeding arguments
    parser.add_argument('--with-project', action='store_true', help='Also seed a project and link it to account')
    parser.add_argument('--project-id', type=int, default=9999, help='Project ID')
    parser.add_argument('--project-name', type=str, default='Coastal GasLink Pipeline', help='Project name')
    parser.add_argument('--account-project-id', type=int, default=7777, help='AccountProject ID')
    parser.add_argument('--ea-certificate', type=str, default='E2E-2024-01', help='EA Certificate')
    parser.add_argument('--epic-guid', type=str, default='588511d4aaecd9001b82656c', help='EPIC GUID')

    # Cleanup flag
    parser.add_argument('--cleanup', action='store_true', help='Cleanup test data instead of seeding')

    args = parser.parse_args()

    print("=" * 60)
    if args.cleanup:
        print("E2E Test Data Cleanup")
    else:
        print("E2E Test Data Seeding")
    print("=" * 60)

    app = create_app()

    with app.app_context():
        if args.cleanup:
            # Cleanup mode
            cleanup_test_data(
                guid=args.guid,
                proponent_id=args.proponent_id,
                project_id=args.project_id if args.with_project else None
            )
        else:
            # Seeding mode
            if args.with_project:
                # Seed complete setup
                if not args.guid:
                    print("Error: --guid is required for seeding with project")
                    sys.exit(1)

                seed_proponent_with_project(
                    guid=args.guid,
                    proponent_id=args.proponent_id,
                    account_id=args.account_id,
                    project_id=args.project_id,
                    account_project_id=args.account_project_id,
                    project_name=args.project_name,
                    first_name=args.first_name,
                    last_name=args.last_name,
                    position=args.position,
                    work_email=args.work_email,
                    work_phone=args.work_phone,
                    extension=args.extension,
                    role_name=args.role,
                    accept_terms_of_service=not args.no_terms_of_service
                )
            elif args.account_only:
                # Seed just account
                seed_account(
                    proponent_id=args.proponent_id,
                    account_id=args.account_id
                )
            else:
                # Seed just user (requires account_id)
                if not args.guid:
                    print("Error: --guid is required for seeding user")
                    sys.exit(1)
                if not args.account_id_for_user:
                    print("Error: --account-id-for-user is required when seeding user without --with-project")
                    sys.exit(1)

                seed_proponent_user(
                    guid=args.guid,
                    account_id=args.account_id_for_user,
                    first_name=args.first_name,
                    last_name=args.last_name,
                    position=args.position,
                    work_email=args.work_email,
                    work_phone=args.work_phone,
                    extension=args.extension,
                    role_name=args.role,
                    accept_terms_of_service=not args.no_terms_of_service
                )

        print()
        print("=" * 60)
        if args.cleanup:
            print("✓ E2E test data cleanup completed!")
        else:
            print("✓ E2E test data seeded successfully!")
        print("=" * 60)


if __name__ == '__main__':
    main()
