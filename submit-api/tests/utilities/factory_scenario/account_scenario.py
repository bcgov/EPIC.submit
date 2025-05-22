"""Module for defining various account scenarios for testing with realistic data."""
from enum import Enum

from faker import Faker

from src.submit_api.models import Account as AccountModel

fake = Faker()


class AccountScenario(Enum):
    """Account scenarios for testing with realistic data according to the model."""

    default_account = {
        "proponent_id": fake.random_int(1),
    }

    account1 = {
        "proponent_id": 1,
    }

    account2 = {
        "proponent_id": 2,
    }

    @staticmethod
    def create(account_data: dict):
        """Create and save an Account instance."""
        account = AccountModel(**account_data)
        account.save()
        return account
