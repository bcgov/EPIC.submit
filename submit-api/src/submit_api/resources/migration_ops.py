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
"""Temporary migration endpoints - can be removed after migration is complete."""
from http import HTTPStatus

from flask import current_app
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from sqlalchemy import text

from submit_api.auth import auth
from submit_api.models import db
from submit_api.resources.apihelper import Api as ApiHelper
from submit_api.services.keycloak import KeycloakService
from submit_api.utils.roles import EpicSubmitRole
from submit_api.utils.util import allowedorigins, cors_preflight


API = Namespace('Migration', description='Temporary migration endpoints')


@cors_preflight("POST, OPTIONS")
@API.route('/migrate-user-ids-to-usernames', methods=["POST", "OPTIONS"])
class MigrateUserIdsToUsernames(Resource):
    """Endpoint to migrate Keycloak user IDs to identity provider usernames."""

    @staticmethod
    @ApiHelper.swagger_decorators(
        API,
        endpoint_description="Migrate all Keycloak user IDs to identity provider usernames"
    )
    @API.response(code=200, description="Migration completed successfully")
    @API.response(code=500, description="Migration failed")
    @auth.require
    @auth.has_one_of_staff_roles([EpicSubmitRole.MANAGE_USERS.value])
    @cross_origin(origins=allowedorigins())
    def post():  # pylint: disable=too-many-locals
        """
        Migrate Keycloak user IDs to identity provider usernames.

        This endpoint:
        1. Fetches all users from Keycloak
        2. Creates a mapping of user ID -> username
        3. Updates all tables containing user references

        Tables updated:
        - users.auth_guid
        - All created_by and updated_by columns across all tables
        - Foreign key references to users.auth_guid
        """
        try:
            current_app.logger.info("Starting user ID to username migration...")

            # Query all foreign key constraints that reference users.auth_guid
            current_app.logger.info("Querying foreign key constraints on users.auth_guid...")
            fk_query = text("""
                SELECT 
                    tc.table_name, 
                    tc.constraint_name,
                    kcu.column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND ccu.table_name = 'users'
                    AND ccu.column_name = 'auth_guid'
                    AND tc.table_schema = 'public'
            """)

            fk_constraints = db.session.execute(fk_query).fetchall()
            dropped_constraints = []

            # Drop each foreign key constraint
            current_app.logger.info(f"Dropping {len(fk_constraints)} foreign key constraints...")
            for constraint in fk_constraints:
                table_name = constraint[0]
                constraint_name = constraint[1]
                column_name = constraint[2]
                
                drop_sql = f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {constraint_name}"
                db.session.execute(text(drop_sql))
                
                dropped_constraints.append({
                    'table': table_name,
                    'constraint': constraint_name,
                    'column': column_name
                })
                current_app.logger.info(f"Dropped constraint {constraint_name} on {table_name}.{column_name}")

            # Fetch all users from Keycloak
            current_app.logger.info("Fetching users from Keycloak...")
            users = KeycloakService.get_users()

            if not users:
                # Recreate constraints before returning
                current_app.logger.info("No users found, recreating constraints...")
                for fk in dropped_constraints:
                    create_sql = f"""
                        ALTER TABLE {fk['table']} 
                        ADD CONSTRAINT {fk['constraint']} 
                        FOREIGN KEY ({fk['column']}) 
                        REFERENCES users(auth_guid)
                    """
                    db.session.execute(text(create_sql))
                db.session.commit()
                return {
                    "message": "No users found in Keycloak",
                    "migrated_count": 0
                }, HTTPStatus.OK

            # Create mapping: keycloak_id -> username
            user_mapping = {}
            for user in users:
                keycloak_id = user.get('id')
                username = user.get('username')
                if keycloak_id and username:
                    user_mapping[keycloak_id] = username

            current_app.logger.info(f"Found {len(user_mapping)} users to migrate")

            # Tables to update with their columns
            tables_to_update = [
                ('accounts', ['created_by', 'updated_by']),
                ('account_users', ['created_by', 'updated_by']),
                ('account_projects', ['created_by', 'updated_by']),
                ('account_terms_of_service', ['created_by', 'updated_by']),
                ('activity_logs', ['created_by', 'updated_by']),
                ('email_queue', ['created_by', 'updated_by']),
                ('internal_staff_documents', ['created_by', 'updated_by']),
                ('invitations', ['created_by', 'updated_by']),
                ('items', ['created_by', 'updated_by']),
                ('item_types', ['created_by', 'updated_by']),
                ('packages', ['created_by', 'updated_by', 'submitted_by']),
                ('package_item_types', ['created_by', 'updated_by']),
                ('package_metadata', ['created_by', 'updated_by']),
                ('package_types', ['created_by', 'updated_by']),
                ('roles', ['created_by', 'updated_by']),
                ('staff_users', ['created_by', 'updated_by']),
                ('submissions', ['created_by', 'updated_by']),
                ('submission_item_notes', ['created_by', 'updated_by']),
                ('submission_reviews', ['created_by', 'updated_by']),
                ('submission_review_entries', ['updated_by', 'created_by']),
                ('submitted_documents', ['created_by', 'updated_by']),
                ('submitted_forms', ['created_by', 'updated_by']),
                ('update_requests', ['created_by', 'updated_by']),
                ('user_roles', ['created_by', 'updated_by']),
                ('user_status', ['created_by', 'updated_by']),
                ('users', ['auth_guid', 'created_by', 'updated_by']),
            ]

            migration_results = {
                "total_users": len(user_mapping),
                "tables_updated": [],
                "errors": []
            }

            # Update each table
            for table_name, columns in tables_to_update:
                for column in columns:
                    try:
                        current_app.logger.info(f"Updating {table_name}.{column}...")

                        # Build CASE statement for batch update
                        case_statements = []
                        for keycloak_id, username in user_mapping.items():
                            # Escape single quotes in username
                            escaped_username = username.replace("'", "''")
                            escaped_id = keycloak_id.replace("'", "''")
                            case_statements.append(
                                f"WHEN '{escaped_id}' THEN '{escaped_username}'"
                            )

                        case_sql = " ".join(case_statements)

                        # Update query
                        update_sql = f"""
                            UPDATE {table_name}
                            SET {column} = CASE {column}
                                {case_sql}
                                ELSE {column}
                            END
                            WHERE {column} IS NOT NULL
                        """

                        result = db.session.execute(text(update_sql))
                        rows_affected = result.rowcount

                        migration_results["tables_updated"].append({
                            "table": table_name,
                            "column": column,
                            "rows_affected": rows_affected
                        })

                        current_app.logger.info(
                            f"✓ Updated {table_name}.{column} - {rows_affected} rows affected"
                        )

                    except Exception as e:  # noqa: B902
                        error_msg = f"Error updating {table_name}.{column}: {str(e)}"
                        current_app.logger.error(error_msg)
                        migration_results["errors"].append(error_msg)
                        raise e

            # Recreate all foreign key constraints
            current_app.logger.info(f"Recreating {len(dropped_constraints)} foreign key constraints...")
            for fk in dropped_constraints:
                table_name = fk['table']
                constraint_name = fk['constraint']
                column_name = fk['column']
                
                create_sql = f"""
                    ALTER TABLE {table_name} 
                    ADD CONSTRAINT {constraint_name} 
                    FOREIGN KEY ({column_name}) 
                    REFERENCES users(auth_guid)
                """
                db.session.execute(text(create_sql))
                current_app.logger.info(f"Recreated constraint {constraint_name} on {table_name}.{column_name}")

            current_app.logger.info("All foreign key constraints recreated successfully")

            # Commit all changes
            db.session.commit()

            current_app.logger.info("Migration completed successfully!")

            return {
                "message": "Migration completed successfully",
                "results": migration_results
            }, HTTPStatus.OK

        except Exception as e:  # noqa: B902  # pylint: disable=broad-exception-caught
            # Transaction will rollback automatically, including constraint drops
            db.session.rollback()
            error_msg = f"Migration failed: {str(e)}"
            current_app.logger.error(error_msg)
            return {
                "message": "Migration failed",
                "error": error_msg
            }, HTTPStatus.INTERNAL_SERVER_ERROR
