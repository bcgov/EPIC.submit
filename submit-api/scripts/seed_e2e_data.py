#!/usr/bin/env python3
"""Seed E2E test data for Playwright tests.

This module provides a CLI interface for seeding test data using modular seeding functions.
"""
import sys
import os

# Add src to path so we can import submit_api modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from submit_api import create_app

# Import all seeding functions from modular seeds/
from seeds import (
    seed_account,
    seed_project,
    seed_account_project,
    seed_proponent_user,
    seed_staff_user,
    seed_proponent_with_project,
    cleanup_test_data
)


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
