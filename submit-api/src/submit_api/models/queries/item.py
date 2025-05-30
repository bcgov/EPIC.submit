# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Model to handle all complex operations related to submission items and their associated documents."""

from submit_api.exceptions import BadRequestError, ResourceNotFoundError
from submit_api.models.db import db
from submit_api.models.item import Item
from submit_api.models.item_type import ItemType, SubmissionItemType


FOLDER_TO_ITEM_TYPE = {
    'consultation_records': SubmissionItemType.CONSULTATION_RECORD,
    'management_plan': SubmissionItemType.MANAGEMENT_PLAN_FORM,
    'supporting': SubmissionItemType.MANAGEMENT_PLAN_FORM,
    'contact_information': SubmissionItemType.CONTACT_INFORMATION,
    'iems': SubmissionItemType.IEM,
}

class ItemQueries:
    """Provides complex item-related queries for submissions."""

    @classmethod
    def get_item_id_for_folder(cls, package_id: int, folder_name: str) -> int:
        """
        Retrieve the item ID associated with a given folder name and package.

        This is used to resolve the item to which a document should be moved,
        based on the logical folder requested by the frontend."""
        try:
            item_type_enum = FOLDER_TO_ITEM_TYPE[folder_name]
        except KeyError:
            raise BadRequestError(f"Unknown folder: {folder_name}")

        # Find ItemType
        item_type = db.session.query(ItemType).filter(ItemType.name == item_type_enum.value).first()
        if not item_type:
            raise ResourceNotFoundError(f"No ItemType found for {item_type_enum.value}")

        # Find Item for the same package with this type
        item = db.session.query(Item).filter_by(package_id=package_id, type_id=item_type.id).first()
        if not item:
            raise ResourceNotFoundError(f"No Item found for package_id={package_id} and type={item_type_enum.value}")

        return item.id
