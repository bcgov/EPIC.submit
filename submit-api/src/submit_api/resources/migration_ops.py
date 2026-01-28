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
from sqlalchemy import exc, text

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
    def post():
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

            # Disable foreign key constraints temporarily
            current_app.logger.info("Disabling foreign key constraints...")
            db.session.execute(text("SET session_replication_role = 'replica';"))

            # Fetch all users from Keycloak
            current_app.logger.info("Fetching users from Keycloak...")
            users = KeycloakService.get_users()

            if not users:
                # Re-enable foreign key constraints before returning
                db.session.execute(text("SET session_replication_role = 'origin';"))
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

                    except exc.SQLAlchemyError as e:
                        error_msg = f"Error updating {table_name}.{column}: {str(e)}"
                        current_app.logger.error(error_msg)
                        migration_results["errors"].append(error_msg)
                        raise

            # Commit all changes
            db.session.commit()

            # Re-enable foreign key constraints
            current_app.logger.info("Re-enabling foreign key constraints...")
            db.session.execute(text("SET session_replication_role = 'origin';"))
            db.session.commit()

            current_app.logger.info("Migration completed successfully!")

            return {
                "message": "Migration completed successfully",
                "results": migration_results
            }, HTTPStatus.OK

        except Exception as e:  # noqa: B902
            # Re-enable foreign key constraints on error
            try:
                db.session.execute(text("SET session_replication_role = 'origin';"))
            except exc.SQLAlchemyError:
                pass  # If this fails, the session will be rolled back anyway

            db.session.rollback()
            error_msg = f"Migration failed: {str(e)}"
            current_app.logger.error(error_msg)
            return {
                "message": "Migration failed",
                "error": error_msg
            }, HTTPStatus.INTERNAL_SERVER_ERROR
