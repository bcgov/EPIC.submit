"""This module holds data classes."""
from typing import List, Union
from attr import dataclass
from submit_api.models.package import PackageStatus, NonCanonicalPackageStatus


@dataclass
class AccountProjectSearchOptions:  # pylint: disable=too-many-instance-attributes
    """Used to store account project search options."""

    search_text: str
    status: List[Union[PackageStatus, NonCanonicalPackageStatus]]
    submitted_on_start: str
    submitted_on_end: str


@dataclass
class DocumentSearchOptions:  # pylint: disable=too-many-instance-attributes
    """Used to store document search options."""

    search_text: str


@dataclass
class ProjectDocumentSearchOptions:  # pylint: disable=too-many-instance-attributes
    """Used to store paginated document search options."""

    page: int
    size: int
    project_id: int = None
    name: str = None
    work_phase: List[str] = None
    submission_type: List[str] = None
    status: List[str] = None
    submitted_on_start: str = None
    submitted_on_end: str = None
