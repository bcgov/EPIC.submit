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
"""Super class to handle all operations related to base model."""
from datetime import datetime, UTC

from sqlalchemy import Column
from sqlalchemy.ext.declarative import declared_attr

from submit_api.utils.token_info import TokenInfo

from .db import db


TENANT_ID = 'tenant_id'


class BaseModel(db.Model):
    """This class manages all of the base model functions."""

    __abstract__ = True

    created_date = db.Column(db.DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_date = db.Column(
        db.DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=True
    )

    @declared_attr
    def created_by(cls):  # pylint:disable=no-self-argument, # noqa: N805
        """Return foreign key for created by."""
        return Column(db.String(50), default=cls._get_current_user)

    @declared_attr
    def updated_by(cls):  # pylint:disable=no-self-argument, # noqa: N805
        """Return foreign key for modified by."""
        return Column(db.String(50), onupdate=cls._get_current_user)

    @staticmethod
    def _get_current_user():
        """Return the current user.

        Used to populate the created_by and modified_by relationships on all models.
        """
        return TokenInfo.get_username()

    @classmethod
    def find_by_id(cls, identifier: int):
        """Return model by id."""
        return db.session.get(cls, identifier)

    @staticmethod
    def commit():
        """Commit the session."""
        db.session.commit()

    def flush(self):
        """Save and flush."""
        db.session.add(self)
        db.session.flush()
        return self

    def add_to_session(self):
        """Save and flush."""
        return self.flush()

    def save(self):
        """Save and commit."""
        db.session.add(self)
        db.session.flush()
        db.session.commit()

    def delete(self):
        """Delete and commit."""
        db.session.delete(self)
        db.session.flush()
        db.session.commit()

    def persist(self, session=None):
        """Add to session and flush, or save and commit if no session provided."""
        if session:
            session.add(self)
            session.flush()
        else:
            self.save()
        return self

    @staticmethod
    def rollback():
        """RollBack."""
        db.session.rollback()
