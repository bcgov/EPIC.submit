"""Service for package management."""
from typing import List, Dict, Any, Tuple

from submit_api.enums.package_type import PackageApprovalType
from submit_api.models import PackageType, TrackPhase, ItemType, PackageItemType
from submit_api.models.db import db
from submit_api.models.item_type import SubmissionMethod
from submit_api.utils.constants import SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP
from submit_api.models.queries.package_type import PackageTypeQueries


class PackageTypeService:
    """Package Type management service."""

    @staticmethod
    def get_email_sender_for_package_type(package_type: str) -> str:
        """Get the email sender for the package type."""
        return SUBMISSION_PACKAGE_TYPE_EMAIL_SENDER_MAP.get(package_type, None)

    @staticmethod
    def _process_item_types(
        item_types: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Process item types - validate existing or create new ones.

        Args:
            item_types: List of item type definitions

        Returns:
            Tuple of (processed_item_types_with_metadata, created_item_types)
            where processed_item_types_with_metadata contains dicts with 'id' and 'is_required'

        Raises:
            ValueError: If item type ID not found
        """
        processed_item_types = []
        created_item_types = []

        for item_type_def in item_types:
            is_required = item_type_def.get('is_required', True)
            if 'id' in item_type_def and item_type_def['id'] is not None:
                # Existing item type - validate it exists
                item_type_id = item_type_def['id']
                item_type = ItemType.find_by_id(item_type_id)
                if not item_type:
                    raise ValueError(f"Item type with ID {item_type_id} not found")
                processed_item_types.append({
                    'id': item_type_id,
                    'is_required': is_required
                })
            else:
                # New item type - create it
                item_type_id, created_info = PackageTypeService._create_or_get_item_type(
                    item_type_def['name'],
                    item_type_def['submission_method']
                )
                processed_item_types.append({
                    'id': item_type_id,
                    'is_required': is_required
                })
                if created_info:
                    created_item_types.append(created_info)

        return processed_item_types, created_item_types

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
        item_types_data: List[Dict[str, Any]]
    ) -> None:
        """Create package-item type associations.

        Args:
            package_type_id: Package type ID
            item_types_data: List of dicts containing 'id' and 'is_required' for each item type
        """
        for idx, item_data in enumerate(item_types_data):
            package_item_type = PackageItemType(
                package_type_id=package_type_id,
                item_type_id=item_data['id'],
                sort_order=idx + 1,
                is_required=item_data.get('is_required', True)
            )
            db.session.add(package_item_type)

    @staticmethod
    def create_or_update_package_type(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a package type with optional phase association.

        This method is idempotent - it will create a new package type if it doesn't exist,
        or update the existing one if it does. It also creates new item types if they don't exist.

        Args:
            data: Dictionary containing:
                - ea_act_name: Environmental Assessment Act name (optional)
                - work_type_name: Work type name (optional)
                - phase_name: Phase name (can be display_name or name) (optional)
                - package_type_name: Name of the package type to create/update
                - package_type_title: Display title for the package type
                - item_types: List of item type definitions (either {'id': int} or
                             {'name': str, 'submission_method': str})

        Returns:
            Dict containing the created/updated package type information

        Raises:
            ValueError: If phase fields provided but phase not found, or item types are invalid
        """
        start_phase, end_phase = PackageTypeService._resolve_phases(data)
        start_phase_id = start_phase.id if start_phase else None
        end_phase_id = end_phase.id if end_phase else None

        # Process item types - create new ones or validate existing ones
        processed_item_types, created_item_types = PackageTypeService._process_item_types(
            data['item_types']
        )

        # Check if package type already exists for this phase (or no phase)
        existing_package_type = PackageType.find_by_name_and_phases(
            data['package_type_name'],
            start_phase_id,
            end_phase_id
        )

        if existing_package_type:
            # Update existing package type
            package_type = existing_package_type
            package_type.title = data['package_type_title']
            package_type.mandatory = data.get('mandatory', False)
            package_type.versioning_enabled = data.get('versioning_enabled', True)
            package_type.success_message = data.get('success_message')
            package_type.phase_label = data.get('phase_label')
            approval_type = data.get('approval_type')
            if approval_type:
                package_type.approval_type = PackageApprovalType[approval_type]
            else:
                package_type.approval_type = None
            package_type.updated_by = 'system'  # TODO: Get from auth context

            # Remove existing item type associations
            PackageItemType.delete_by_package_type_id(package_type.id)
        else:
            # Create new package type
            approval_type = data.get('approval_type')
            package_type = PackageType(
                name=data['package_type_name'],
                title=data['package_type_title'],
                start_phase_id=start_phase_id,
                end_phase_id=end_phase_id,
                phase_label=data.get('phase_label'),
                mandatory=data.get('mandatory', False),
                approval_type=PackageApprovalType[approval_type] if approval_type else None,
                versioning_enabled=data.get('versioning_enabled', True),
                success_message=data.get('success_message'),
                created_by='system'  # TODO: Get from auth context
            )
            db.session.add(package_type)

        # Flush to get the package_type.id
        db.session.flush()

        # Create item type associations
        PackageTypeService._create_item_type_associations(package_type.id, processed_item_types)

        db.session.commit()

        response = {
            'id': package_type.id,
            'name': package_type.name,
            'title': package_type.title,
            'start_phase_id': package_type.start_phase_id,
            'end_phase_id': package_type.end_phase_id,
            'phase_label': package_type.phase_label,
            'item_type_ids': [item['id'] for item in processed_item_types],
            'created_item_types': created_item_types,
            'created': existing_package_type is None,
            'mandatory': package_type.mandatory,
            'approval_type': package_type.approval_type.value if package_type.approval_type else None,
            'versioning_enabled': package_type.versioning_enabled,
            'success_message': package_type.success_message
        }

        # Add phase information if phases exist
        response['phase_name'] = (start_phase.display_name or start_phase.name) if start_phase else None
        response['end_phase_name'] = (end_phase.display_name or end_phase.name) if end_phase else None
        response['ea_act_name'] = start_phase.ea_act_name if start_phase else None
        response['work_type_name'] = start_phase.work_type_name if start_phase else None

        return response

    @staticmethod
    def _resolve_phases(data: Dict[str, Any]):
        """Resolve the start and end phases from the request data.

        The end phase uses the same EA Act and work type as the start phase and defaults to the
        start phase when ``end_phase_name`` is not provided. Returns ``(None, None)`` when no
        phase fields are provided (phase-less package type).

        Raises:
            ValueError: If the start or end phase cannot be found.
        """
        if not (data.get('ea_act_name') and data.get('work_type_name') and data.get('phase_name')):
            return None, None

        start_phase = PackageTypeService._find_phase(data, data['phase_name'])
        end_phase_name = data.get('end_phase_name')
        if not end_phase_name or end_phase_name == data['phase_name']:
            return start_phase, start_phase
        return start_phase, PackageTypeService._find_phase(data, end_phase_name)

    @staticmethod
    def _find_phase(data: Dict[str, Any], phase_name: str) -> TrackPhase:
        """Find a phase by the request's EA Act and work type and the given phase name."""
        phase = TrackPhase.find_by_identifiers(data['ea_act_name'], data['work_type_name'], phase_name)
        if not phase:
            raise ValueError(
                f"Phase not found for EA Act: '{data['ea_act_name']}', "
                f"Work Type: '{data['work_type_name']}', Phase: '{phase_name}'"
            )
        return phase

    @staticmethod
    def get_by_project_id(project_id: int) -> List[PackageType]:
        """Get package types available for a given project based on its active work phases"""
        return PackageTypeQueries.find_by_project_id(project_id)
