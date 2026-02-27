"""Environmental Assessment Act enum."""
from enum import Enum


class EAActName(str, Enum):
    """Environmental Assessment Act names."""

    EA_ACT_1996 = "EA Act (1996)"
    EA_ACT_2002 = "EA Act (2002)"
    EA_ACT_2018 = "EA Act (2018)"
    OTHER = "Other"

    @classmethod
    def get_by_id(cls, ea_act_id: int):
        """Get EA Act name by ID."""
        mapping = {
            1: cls.EA_ACT_1996,
            2: cls.EA_ACT_2002,
            3: cls.EA_ACT_2018,
            4: cls.OTHER,
        }
        return mapping.get(ea_act_id)

    @classmethod
    def get_id_by_name(cls, name: str):
        """Get EA Act ID by name."""
        mapping = {
            cls.EA_ACT_1996.value: 1,
            cls.EA_ACT_2002.value: 2,
            cls.EA_ACT_2018.value: 3,
            cls.OTHER.value: 4,
        }
        return mapping.get(name)
