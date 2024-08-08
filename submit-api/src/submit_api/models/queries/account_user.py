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
"""Model to handle all complex operations related to User."""
from submit_api.models import AccountUser, Account, AccountProject, db


# pylint: disable=too-few-public-methods
class UserQueries:
    """Query module for complex user queries"""

    @classmethod
    def get_by_guid(cls, guid: int):
        """Find user by guid"""
        result = (db.session.query.filter_by(auth_guid=guid)
                  .join(Account, Account.id == AccountUser.account_id)
                  .join(AccountProject, AccountProject.account_id == Account.id)
                  .first())
        return result
