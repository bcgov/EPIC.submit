# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Service for internal staff document service."""
from submit_api.exceptions import ResourceNotFoundError
from submit_api.models.package import Package as PackageModel
from submit_api.models.internal_staff_document import InternalStaffDocument as InternalStaffDocumentModel
from submit_api.utils.token_info import TokenInfo


class InternalStaffDocumentService:
    """Item management service."""

    @classmethod
    def create_internal_staff_document(cls, package_id, data):
        """Create internal staff document."""
        package = PackageModel.find_by_id(package_id)
        if not package:
            raise ResourceNotFoundError("Package not found")

        internal_staff_document = InternalStaffDocumentModel(
            name=data.get("name"),
            url=data.get("url"),
            type=data.get("type"),
            package_id=package_id,
            created_by=TokenInfo.get_username(),
        )
        internal_staff_document.save()
        return internal_staff_document

    @classmethod
    def delete_internal_staff_document(cls, internal_staff_document_id):
        """Delete internal staff document."""
        internal_staff_document = InternalStaffDocumentModel.find_by_id(internal_staff_document_id)
        if not internal_staff_document:
            raise ResourceNotFoundError("Internal staff document not found")
        internal_staff_document.delete()
        return internal_staff_document
