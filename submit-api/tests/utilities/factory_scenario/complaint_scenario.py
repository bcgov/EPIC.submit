"""Various test data for complaint."""

from enum import Enum

from faker import Faker


fake = Faker()


class ComplaintScenario(Enum):
    """ComplaintScenario."""

    complaint_default = {
        "project_id": 1,
        "concern_description": fake.word(),
        "location_description": fake.word(),
        "project_description": fake.word(),
        "lead_officer_id": 1,
        "case_file_id": 3,
        "date_received": "2024-09-24T16:41:28.088Z",
        "source_type_id": 4,
        "complaint_source_contact": {
            "description": fake.text(max_nb_chars=50),
            "full_name": fake.word(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "comment": fake.text(max_nb_chars=50),
        },
    }
