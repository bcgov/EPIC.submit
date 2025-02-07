"""This module holds data classes."""
from typing import List

from attr import dataclass

from submit_api.models.package import PackageStatus


@dataclass
class AccountProjectSearchOptions:  # pylint: disable=too-many-instance-attributes
    """Used to store account project search options."""

    search_text: str
    status: List[PackageStatus]  # Update to be a list of PackageStatus
    submitted_on_start: str
    submitted_on_end: str

@dataclass
class DocumentSearchOptions:  # pylint: disable=too-many-instance-attributes
    """Used to store document search options."""

    search_text: str
