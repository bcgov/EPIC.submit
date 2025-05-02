""" add the IEM package type and item type

Revision ID: df4613866744
Revises: dfd81c02e843
Create Date: 2025-04-30 12:41:23.463283

"""
from datetime import datetime
from sqlalchemy.sql import bindparam

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'df4613866744'
down_revision = 'dfd81c02e843'
branch_labels = None
depends_on = None

# Define constants for magic strings
PACKAGE_TYPE_IEM = 'IEM'
ITEM_TYPE_IEM_TERMS = 'IEM Terms of Engagement'
ITEM_TYPE_CONSULTATION_RECORDS = 'Consultation Record(s)'
ITEM_TYPE_CONTACT_INFORMATION_FORM = 'Contact Information Form'
FORM_SUBMISSION = 'FORM_SUBMISSION'


def upgrade():
    package_types = sa.Table(
        'package_types',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String),
        sa.Column('created_date', sa.DateTime, default=datetime.utcnow),
        sa.Column('created_by', sa.String, default='system'),
    )
    item_types = sa.Table(
        'item_types',
        sa.MetaData(),
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String),
        sa.Column('created_date', sa.DateTime, default=datetime.utcnow),
        sa.Column('submission_method', sa.Enum('FORM_SUBMISSION', 'DOCUMENT_UPLOAD', name='submissionmethod')),
        sa.Column('created_by', sa.String, default='system'),
    )
    package_item_types = sa.Table(
        'package_item_types',
        sa.MetaData(),
        sa.Column('package_type_id', sa.Integer),
        sa.Column('item_type_id', sa.Integer),
        sa.Column('created_date', sa.DateTime, default=datetime.utcnow),
        sa.Column('created_by', sa.String, default='system'),
    )

    # Insert new package type
    op.bulk_insert(package_types, [
        {'name': PACKAGE_TYPE_IEM, 'created_date': datetime.utcnow()},
    ])
    conn = op.get_bind()

    # Retrieve the new package type ID using parameterized query
    iem_package_type_id = conn.execute(
        sa.select(package_types.c.id).where(package_types.c.name == bindparam('name')),
        {'name': PACKAGE_TYPE_IEM}
    ).fetchone()[0]

    # Insert new item types
    op.bulk_insert(item_types, [
        {'name': ITEM_TYPE_IEM_TERMS, 'created_date': datetime.utcnow(), 'submission_method': FORM_SUBMISSION},
    ])

    # Retrieve item type IDs using parameterized query
    item_type_ids = {row[1]: row[0] for row in conn.execute(
        sa.select(item_types.c.id, item_types.c.name)
        .where(item_types.c.name.in_([
            bindparam('item1'), bindparam('item2'), bindparam('item3')
        ])),
        {'item1': ITEM_TYPE_IEM_TERMS, 'item2': ITEM_TYPE_CONSULTATION_RECORDS, 'item3': ITEM_TYPE_CONTACT_INFORMATION_FORM}
    ).fetchall()}

    # Insert package item types
    op.bulk_insert(package_item_types, [
        {'package_type_id': iem_package_type_id, 'item_type_id': item_type_ids[ITEM_TYPE_IEM_TERMS],
         'created_date': datetime.utcnow()},
        {'package_type_id': iem_package_type_id, 'item_type_id': item_type_ids[ITEM_TYPE_CONSULTATION_RECORDS],
         'created_date': datetime.utcnow()},
        {'package_type_id': iem_package_type_id, 'item_type_id': item_type_ids[ITEM_TYPE_CONTACT_INFORMATION_FORM],
         'created_date': datetime.utcnow()},
    ])


def downgrade():
    pass
