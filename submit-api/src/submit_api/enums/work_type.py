"""Work Type enum."""
from enum import Enum


class WorkTypeName(str, Enum):
    """Work Type names from EPIC.track."""

    PROJECT_NOTIFICATION = "Project Notification"
    MINISTERS_DESIGNATION = "Minister's Designation"
    CEAOS_DESIGNATION = "CEAO's Designation"
    INTAKE_PRE_EA = "Intake (Pre-EA)"
    EXEMPTION_ORDER = "Exemption Order"
    ASSESSMENT = "Assessment"
    AMENDMENT = "Amendment"
    POST_EAC_DOCUMENT_REVIEW = "Post-EAC Document Review"
    EAC_EXTENSION = "EAC Extension"
    SUBSTANTIAL_START_DETERMINATION = "Substantial Start Determination"
    EAC_ORDER_TRANSFER = "EAC/Order Transfer"
    EAC_ORDER_SUSPENSION = "EAC/Order Suspension"
    EAC_ORDER_CANCELLATION = "EAC/Order Cancellation"
    OTHER = "Other"
    MATERIAL_ALTERATION = "Material Alteration"

    @classmethod
    def get_by_id(cls, work_type_id: int):
        """Get Work Type name by ID."""
        mapping = {
            1: cls.PROJECT_NOTIFICATION,
            2: cls.MINISTERS_DESIGNATION,
            3: cls.CEAOS_DESIGNATION,
            4: cls.INTAKE_PRE_EA,
            5: cls.EXEMPTION_ORDER,
            6: cls.ASSESSMENT,
            7: cls.AMENDMENT,
            8: cls.POST_EAC_DOCUMENT_REVIEW,
            9: cls.EAC_EXTENSION,
            10: cls.SUBSTANTIAL_START_DETERMINATION,
            11: cls.EAC_ORDER_TRANSFER,
            12: cls.EAC_ORDER_SUSPENSION,
            13: cls.EAC_ORDER_CANCELLATION,
            14: cls.OTHER,
            15: cls.MATERIAL_ALTERATION,
        }
        return mapping.get(work_type_id)

    @classmethod
    def get_id_by_name(cls, name: str):
        """Get Work Type ID by name."""
        mapping = {
            cls.PROJECT_NOTIFICATION.value: 1,
            cls.MINISTERS_DESIGNATION.value: 2,
            cls.CEAOS_DESIGNATION.value: 3,
            cls.INTAKE_PRE_EA.value: 4,
            cls.EXEMPTION_ORDER.value: 5,
            cls.ASSESSMENT.value: 6,
            cls.AMENDMENT.value: 7,
            cls.POST_EAC_DOCUMENT_REVIEW.value: 8,
            cls.EAC_EXTENSION.value: 9,
            cls.SUBSTANTIAL_START_DETERMINATION.value: 10,
            cls.EAC_ORDER_TRANSFER.value: 11,
            cls.EAC_ORDER_SUSPENSION.value: 12,
            cls.EAC_ORDER_CANCELLATION.value: 13,
            cls.OTHER.value: 14,
            cls.MATERIAL_ALTERATION.value: 15,
        }
        return mapping.get(name)

    @classmethod
    def list_all(cls):
        """Return all work type names."""
        return [member.value for member in cls]
