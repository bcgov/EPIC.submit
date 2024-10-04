"""Service for package management."""
import logging

# Set up logging configuration

from submit_api.models import Item as ItemModel
from submit_api.models import Package as PackageModel
from submit_api.models import PackageType as PackageTypeModel
from submit_api.models.db import session_scope
from submit_api.models.package_metadata import PackageMetadata as PackageMetadataModel
from submit_api.models.package_item_type import PackageItemType as PackageItemTypeModel
logging.basicConfig(level=logging.DEBUG)    


class PackageService:
    """Package management service."""

    @classmethod
    def get_package_by_id(cls, package_id):
        """Get package by id."""
        package = PackageModel.get_package_by_id_with_items(package_id)
        return package

    @classmethod
    def create_package(cls, account_project_id, request_data):
        """Create a new package."""
        with session_scope() as session:
            package_type = PackageTypeModel.find_by_name(
                request_data.get("type"))
            package = cls._create_package(
                session, account_project_id, request_data, package_type)
            cls._create_package_metadata(
                session, package.id, request_data.get("metadata"))
            cls._create_items(session, package.id, package_type.id, package_type.item_types)
            session.commit()
        return PackageModel.find_by_id(package.id)

    @staticmethod
    def _create_package(session, account_project_id, request_data, package_type):
        """Create a new package."""
        package_data = {
            "account_project_id": account_project_id,
            "name": request_data.get("name"),
            "type_id": package_type.id,
        }
        package = PackageModel(**package_data)
        session.add(package)
        session.flush()
        return package

    @staticmethod
    def _create_package_metadata(session, package_id, metadata):
        """Create package metadata."""
        package_metadata = PackageMetadataModel(
            package_id=package_id, package_meta=metadata
        )
        session.add(package_metadata)

    @staticmethod
    def _create_items(session, package_id, package_type_id, item_types):
        """Create items for the package."""
        logging.debug(f"Starting _create_items for package_id: {package_id}")

        # Query package_item_types and create a mapping of item_type_id to package_item_type
        logging.debug("Querying package_item_types...")
        package_item_types = session.query(PackageItemTypeModel).filter_by(
            package_type_id=package_type_id,
        ).all()

        # Log each package_item_type found
        for pit in package_item_types:
            logging.debug(f"Found package_item_type: {pit}")

        logging.debug(f"package_item_types found: {package_item_types}")

        if not package_item_types:
            logging.warning(f"No package_item_types found for package_type_id: {package_type_id}")

        item_type_to_package_item_type = {
            pit.item_type_id: pit for pit in package_item_types
        }

        logging.debug(f"Mapping item_type_id to package_item_type: {item_type_to_package_item_type}")

        items = []
        for item_type in item_types:
            logging.debug(f"Processing item_type: {item_type.id}")

            package_item_type = item_type_to_package_item_type.get(item_type.id)
            if package_item_type:
                logging.debug(f"Found package_item_type for item_type_id {item_type.id}: {package_item_type}")
                item = ItemModel(
                    package_id=package_id,
                    type_id=item_type.id,
                    sort_order=package_item_type.sort_order
                )
                logging.debug(f"Created item: {item}")
                items.append(item)
            else:
                logging.warning(f"No package_item_type found for item_type_id: {item_type.id}")

        # Log each item before sorting
        logging.debug("Logging items before sorting by sort_order:")
        for item in items:
            logging.debug(f"Item before sorting: package_id={item.package_id}, type_id={item.type_id}, sort_order={item.sort_order}")

        # Sort items by sort_order
        logging.debug(f"Sorting items by sort_order...")
        try:
            items.sort(key=lambda item: item.sort_order)
        except TypeError as e:
            logging.error(f"Error while sorting items: {e}")
            raise

        # Log each item after sorting
        logging.debug("Logging items after sorting by sort_order:")
        for item in items:
            logging.debug(f"Item after sorting: package_id={item.package_id}, type_id={item.type_id}, sort_order={item.sort_order}")

        # Add sorted items to the session
        for item in items:
            logging.debug(f"Adding item to session: {item}")
            session.add(item)

        logging.debug("Flushing session...")
        session.flush()
        logging.debug("Session flushed successfully.")