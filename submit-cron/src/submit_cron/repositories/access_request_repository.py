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
"""Repository for access_requests table in the Centre database.

Schema matches EPIC.centre centre-api: id, app_id, user_auth_guid, status (enum),
created_date, updated_date, created_by, updated_by. No name column; user names
come from Auth API. We use user_auth_guid for the link and as display label.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List

from sqlalchemy import text
from sqlalchemy.orm import Session


@dataclass
class PendingAccessRequest:
    """A pending access request record."""

    user_id: str  # user_auth_guid, used in link /auth/users/{user_id}
    name: str  # display label (user_auth_guid when no name available)
    created_at: datetime


class AccessRequestRepository:
    """Queries access_requests in the Centre database (EPIC.centre schema)."""

    def __init__(self, session: Session):
        self.session = session

    def find_pending_older_than_hours(self, hours: int) -> List[PendingAccessRequest]:
        """
        Find access requests in pending status older than the given number of hours.

        Uses EPIC.centre columns: user_auth_guid, created_date, status (enum 'PENDING').
        Returns list of PendingAccessRequest; name is user_auth_guid (no name column in DB).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        # status is PostgreSQL enum accessrequestsstatusenum: 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
        stmt = text("""
            SELECT user_auth_guid, created_date
            FROM access_requests
            WHERE status = :status AND created_date < :cutoff
            ORDER BY created_date ASC
        """)
        rows = self.session.execute(
            stmt, {"status": "PENDING", "cutoff": cutoff}
        ).fetchall()
        return [
            PendingAccessRequest(
                user_id=row[0],
                name=row[0],  # no name column; use user_auth_guid as display
                created_at=row[1],
            )
            for row in rows
        ]
