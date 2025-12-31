"""E2E test data seeding modules.

Organized by domain for scalability and maintainability.
"""

# Core entities
from .core import (
    seed_account,
    seed_project,
    seed_account_project,
    seed_proponent_user,
    seed_staff_user,
    seed_proponent_with_project
)

# Packages
from .package import seed_package_with_items

# Cleanup
from .cleanup import cleanup_test_data

__all__ = [
    # Core
    'seed_account',
    'seed_project',
    'seed_account_project',
    'seed_proponent_user',
    'seed_staff_user',
    'seed_proponent_with_project',

    # Packages
    'seed_package_with_items',

    # Cleanup
    'cleanup_test_data'
]
