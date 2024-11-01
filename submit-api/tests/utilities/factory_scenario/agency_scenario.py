"""Various test data for agency."""
from enum import Enum

from faker import Faker

from compliance_api.models import Agency as AgencyModel

from ..factory_utils import generate_abbreviation


fake = Faker()


class AgencyScenario(Enum):
    """Agency scenario."""

    default_agency = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    agency1 = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    agency2 = {"name": fake.name(), "abbreviation": generate_abbreviation(4)}

    @staticmethod
    def create(agency_data: dict):
        """Create agency."""
        agency = AgencyModel(**agency_data)
        agency.save()
        print("save completed")
        return agency
