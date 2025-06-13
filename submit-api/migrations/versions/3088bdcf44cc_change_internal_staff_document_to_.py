"""Change internal staff document to package relationship

Revision ID: 3088bdcf44cc
Revises: e635c4f73779
Create Date: 2025-06-09 12:06:38.372828

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3088bdcf44cc'
down_revision = '164704893569'
branch_labels = None
depends_on = None


def upgrade():
    # First add the package_id column
    with op.batch_alter_table('internal_staff_documents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('package_id', sa.Integer(), nullable=True))
    
    # Now we can update the data
    op.execute("""
        UPDATE internal_staff_documents isd
        SET package_id = i.package_id
        FROM items i
        WHERE isd.item_id = i.id
    """)
    
    # Then add the foreign key and make it non-nullable
    with op.batch_alter_table('internal_staff_documents', schema=None) as batch_op:
        batch_op.create_foreign_key(None, 'packages', ['package_id'], ['id'])
        batch_op.alter_column('package_id', nullable=False)
        
        # Finally remove the old item_id column and its constraint
        batch_op.drop_constraint('internal_staff_documents_item_id_fkey', type_='foreignkey')
        batch_op.drop_column('item_id')

    with op.batch_alter_table('items', schema=None) as batch_op:
        batch_op.drop_constraint('items_package_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(None, 'packages', ['package_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # First add the item_id column as nullable
    with op.batch_alter_table('internal_staff_documents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('item_id', sa.INTEGER(), autoincrement=False, nullable=True))
        # Drop the package_id foreign key with its name
        batch_op.drop_constraint('internal_staff_documents_package_id_fkey', type_='foreignkey')
        batch_op.drop_column('package_id')

    with op.batch_alter_table('items', schema=None) as batch_op:
        batch_op.drop_constraint('items_package_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('items_package_id_fkey', 'packages', ['package_id'], ['id'], ondelete='CASCADE')

    # ### end Alembic commands ###
