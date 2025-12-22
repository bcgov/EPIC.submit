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


def seed_proponent_user(
    guid: str,
    proponent_id: int = 8888,
    first_name: str = "E2E",
    last_name: str = "Proponent",
    position: str = "Test Administrator",
    work_email: str = "e2e.proponent@test.example.com",
    work_phone: str = "555-0100",
    extension: str = "101",
    role_name: str = "PROJECT_ADMIN",
    accept_terms_of_service: bool = True
) -> tuple:
    """Seed a proponent user with account and role.

    Args:
        guid: The auth_guid for the user (from Keycloak)
        proponent_id: Unique proponent ID for the account
        first_name: User's first name
        last_name: User's last name
        position: User's position/title
        work_email: User's work email address
        work_phone: User's work phone number
        extension: Phone extension (optional)
        role_name: Role to assign (default: PROJECT_ADMIN)
        accept_terms_of_service: Whether to accept terms of service (default: True)

    Returns:
        tuple: (user, account, account_user, user_role)
    """
    print(f"Creating proponent user with GUID: {guid}")

    # Check if user already exists
    existing_user = User.get_by_guid(guid)
    if existing_user:
        print(f"  ℹ User already exists (ID: {existing_user.id})")
        existing_account_user = AccountUser.get_by_guid(guid)
        if existing_account_user:
            print(f"  ℹ Account user already exists (ID: {existing_account_user.id})")
            return existing_user, existing_account_user.account, existing_account_user, existing_account_user.role

    # Create user
    user = User.create_user({
        'auth_guid': guid,
        'type': UserType.PROPONENT
    })
    print(f"  ✓ Created user (ID: {user.id})")

    # Check if account already exists
    existing_account = Account.get_by_proponent_id(proponent_id)
    if existing_account:
        print(f"  ℹ Account already exists for proponent_id {proponent_id} (ID: {existing_account.id})")
        account = existing_account
    else:
        # Create account
        account = Account.create_account({
            'proponent_id': proponent_id
        })
        print(f"  ✓ Created account (ID: {account.id}, proponent_id: {proponent_id})")

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
        'account_project_id': None,  # NULL for account-wide role
        'package_ids': None,  # NULL for project-wide role
        'role_id': role.id
    })
    print(f"  ✓ Created user role (ID: {user_role.id}, role: {role_name})")

    db.session.commit()
    print(f"  ✓ Committed to database")

    return user, account, account_user, user_role


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


def cleanup_test_data(guid: str = None, proponent_id: int = None):
    """Clean up test data.

    Args:
        guid: User GUID to delete (optional)
        proponent_id: Proponent ID to delete (optional)
    """
    if guid:
        user = User.get_by_guid(guid)
        if user:
            print(f"Deleting user with GUID: {guid}")

            # Get account_user to find related records
            account_user = AccountUser.get_by_guid(guid)
            if account_user:
                # Delete user roles first (depends on account_user)
                user_roles = UserRole.query.filter_by(account_user_id=account_user.id).all()
                for user_role in user_roles:
                    db.session.delete(user_role)
                    print(f"  ✓ Deleted user role (ID: {user_role.id})")

                # Delete account user
                db.session.delete(account_user)
                print(f"  ✓ Deleted account user (ID: {account_user.id})")

            # Delete user
            db.session.delete(user)
            print(f"  ✓ Deleted user (ID: {user.id})")

    if proponent_id:
        account = Account.get_by_proponent_id(proponent_id)
        if account:
            # Check if account has any remaining users
            remaining_users = AccountUser.query.filter_by(account_id=account.id).count()
            if remaining_users == 0:
                print(f"Deleting account with proponent_id: {proponent_id}")
                db.session.delete(account)
                print(f"  ✓ Deleted account (ID: {account.id})")
            else:
                print(f"  ℹ Skipping account deletion (ID: {account.id}) - has {remaining_users} remaining users")

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
            cleanup_test_data(guid=args.guid, proponent_id=args.proponent_id)
        else:
            # Seeding mode
            if not args.guid:
                print("Error: --guid is required for seeding")
                sys.exit(1)

            seed_proponent_user(
                guid=args.guid,
                proponent_id=args.proponent_id,
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
