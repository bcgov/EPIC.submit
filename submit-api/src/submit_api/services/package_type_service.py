"""Service for package management."""
from typing import List, Dict, Any, Tuple

from submit_api.models import PackageType, TrackPhase, ItemType, PackageItemType
from submit_api.models.db import db
from submit_api.models.item_type import SubmissionMethod
from submit_api.utils.constants import SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP


class PackageTypeService:
    """Package Type management service."""

    @staticmethod
    def get_email_sender_for_package_type(package_type: str) -> str:
        """Get the email sender for the package type."""
        return SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP.get(package_type, None)

    @staticmethod
    def _process_item_types(
        item_types: List[Dict[str, Any]]
    ) -> Tuple[List[int], List[Dict[str, Any]]]:
        """Process item types - validate existing or create new ones.

        Args:
            item_types: List of item type definitions

        Returns:
            Tuple of (processed_item_type_ids, created_item_types)

        Raises:
            ValueError: If item type ID not found
        """
        processed_item_type_ids = []
        created_item_types = []

        for item_type_def in item_types:
            if 'id' in item_type_def and item_type_def['id'] is not None:
                # Existing item type - validate it exists
                item_type_id = item_type_def['id']
                item_type = ItemType.find_by_id(item_type_id)
                if not item_type:
                    raise ValueError(f"Item type with ID {item_type_id} not found")
                processed_item_type_ids.append(item_type_id)
            else:
                # New item type - create it
                item_type_id, created_info = PackageTypeService._create_or_get_item_type(
                    item_type_def['name'],
                    item_type_def['submission_method']
                )
                processed_item_type_ids.append(item_type_id)
                if created_info:
                    created_item_types.append(created_info)

        return processed_item_type_ids, created_item_types

    @staticmethod
    def _create_or_get_item_type(
        name: str,
        submission_method: str
    ) -> Tuple[int, Dict[str, Any]]:
        """Create a new item type or get existing one by name.

        Args:
            name: Item type name
            submission_method: Submission method (FORM_SUBMISSION or DOCUMENT_UPLOAD)

        Returns:
            Tuple of (item_type_id, created_info_dict or None)
        """
        # Check if item type with this name already exists
        existing_item_type = ItemType.find_by_name(name)
        if existing_item_type:
            return existing_item_type.id, None

        # Create new item type
        new_item_type = ItemType(
            name=name,
            submission_method=SubmissionMethod[submission_method],
            created_by='system'  # TODO: Get from auth context
        )
        db.session.add(new_item_type)
        db.session.flush()  # Get the ID

        created_info = {
            'id': new_item_type.id,
            'name': new_item_type.name,
            'submission_method': submission_method
        }
        return new_item_type.id, created_info

    @staticmethod
    def _create_item_type_associations(
        package_type_id: int,
        item_type_ids: List[int]
    ) -> None:
        """Create package-item type associations.

        Args:
            package_type_id: Package type ID
            item_type_ids: List of item type IDs to associate
        """
        for idx, item_type_id in enumerate(item_type_ids):
            package_item_type = PackageItemType(
                package_type_id=package_type_id,
                item_type_id=item_type_id,
                sort_order=idx + 1
            )
            db.session.add(package_item_type)

    @staticmethod
    def create_or_update_package_type(
        ea_act_name: str,
        work_type_name: str,
        phase_name: str,
        package_type_name: str,
        item_types: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create or update a package type with phase association.

        This method is idempotent - it will create a new package type if it doesn't exist,
        or update the existing one if it does. It also creates new item types if they don't exist.

        Args:
            ea_act_name: Environmental Assessment Act name
            work_type_name: Work type name
            phase_name: Phase name (can be display_name or name)
            package_type_name: Name of the package type to create/update
            item_types: List of item type definitions (either {'id': int} or
                       {'name': str, 'submission_method': str})

        Returns:
            Dict containing the created/updated package type information

        Raises:
            ValueError: If phase not found or item types are invalid
        """
        # Find the phase
        phase = TrackPhase.find_by_identifiers(ea_act_name, work_type_name, phase_name)
        if not phase:
            raise ValueError(
                f"Phase not found for EA Act: '{ea_act_name}', "
                f"Work Type: '{work_type_name}', Phase: '{phase_name}'"
            )

        # Process item types - create new ones or validate existing ones
        processed_item_type_ids, created_item_types = PackageTypeService._process_item_types(item_types)

        # Check if package type already exists
        existing_package_type = PackageType.find_by_name(package_type_name)

        if existing_package_type:
            # Update existing package type
            package_type = existing_package_type
            package_type.phase_id = phase.id
            package_type.updated_by = 'system'  # TODO: Get from auth context

            # Remove existing item type associations
            PackageItemType.delete_by_package_type_id(package_type.id)
        else:
            # Create new package type
            package_type = PackageType(
                name=package_type_name,
                phase_id=phase.id,
                created_by='system'  # TODO: Get from auth context
            )
            db.session.add(package_type)

        # Flush to get the package_type.id
        db.session.flush()

        # Create item type associations
        PackageTypeService._create_item_type_associations(package_type.id, processed_item_type_ids)

        db.session.commit()

        return {
            'id': package_type.id,
            'name': package_type.name,
            'phase_id': package_type.phase_id,
            'phase_name': phase.display_name or phase.name,
            'ea_act_name': phase.ea_act_name,
            'work_type_name': phase.work_type_name,
            'item_type_ids': processed_item_type_ids,
            'created_item_types': created_item_types,
            'created': existing_package_type is None
        }
