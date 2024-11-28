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
from submit_api.models import Item
from submit_api.models.note import Note as NoteModel
from submit_api.utils.token_info import TokenInfo


class NoteService:
    """Item management service."""

    @classmethod
    def create_note(cls, submission_item_id, data):
        """Create note."""
        submission_item = Item.find_by_id(submission_item_id)
        if not submission_item:
            raise ResourceNotFoundError("Submission item not found")

        note = NoteModel(
            name=data.get("name"),
            url=data.get("url"),
            type=data.get("type"),
            item_id=submission_item_id,
            created_by=TokenInfo.get_id(),
        )
        note.save()
        return note
