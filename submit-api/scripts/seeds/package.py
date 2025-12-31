"""Package and Item E2E seeding functions."""

from submit_api.models import Package as PackageModel
from submit_api.models import Item as ItemModel
from submit_api.models.package_type import PackageType as PackageTypeModel
from submit_api.models.package_version import PackageVersion as PackageVersionModel
from submit_api.models.package_metadata import PackageMetadata as PackageMetadataModel
from submit_api.models.package_item_type import PackageItemType as PackageItemTypeModel
from submit_api.models.package import PackageStatus
from submit_api.models.db import db
from submit_api.enums.item_status import ItemStatus


def seed_package_with_items(
    account_project_id: int,
    package_id: int = 8888,
    package_type: str = "Management Plan",
    package_name: str = "E2E Test Package",
    metadata: dict = None
) -> tuple:
    """Seed a complete package with items ready to fill.

    Creates a package with all associated items (Contact Info, Consultation Record,
    Management Plan/IEM) in NEW status, ready for E2E testing.

    Args:
        account_project_id: AccountProject ID (must exist)
        package_id: Explicit package ID for predictability
        package_type: "Management Plan" or "IEM"
        package_name: Name of the package
        metadata: Optional metadata dict (conditions, etc.)

    Returns:
        tuple: (package, items_dict)
            items_dict = {
                'contact_info': Item,
                'consultation_record': Item,
                'management_plan' or 'iem': Item
            }
    """
    print(f"Creating package with items for account_project_id: {account_project_id}")

    # Check if package already exists
    existing_package = PackageModel.query.filter_by(id=package_id).first()
    if existing_package:
        print(f"  ℹ Package already exists (ID: {existing_package.id})")
        # Return existing package with its items
        items_dict = _build_items_dict(existing_package.items)
        return existing_package, items_dict

    # 1. Find PackageType by name
    package_type_model = PackageTypeModel.find_by_name(package_type)
    if not package_type_model:
        raise ValueError(f"PackageType '{package_type}' not found in database")
    print(f"  ✓ Found package type: {package_type} (ID: {package_type_model.id})")

    # 2. Create Package with status=[PackageStatus.NEW]
    package = PackageModel(
        id=package_id,
        account_project_id=account_project_id,
        name=package_name,
        type_id=package_type_model.id,
        status=[PackageStatus.NEW.value]
    )
    db.session.add(package)
    db.session.flush()  # Flush to get package.id for relationships
    print(f"  ✓ Created package (ID: {package.id}, type: {package_type})")

    # 3. Create PackageVersion (version=1, original_package_id=package.id)
    package_version = PackageVersionModel(
        original_package_id=package.id,
        version=1
    )
    db.session.add(package_version)
    db.session.flush()  # Flush to get version.id
    print(f"  ✓ Created package version (ID: {package_version.id}, version: 1)")

    # 4. Link package.version_id to PackageVersion
    package.version_id = package_version.id
    db.session.add(package)

    # 5. Create PackageMetadata
    if metadata is None:
        # Default metadata with empty conditions array
        # Note: Actual conditions would be added by the test or frontend
        metadata = {"conditions": []}

    package_metadata = PackageMetadataModel(
        package_id=package.id,
        json=metadata
    )
    db.session.add(package_metadata)
    print(f"  ✓ Created package metadata")

    # 6. Create Items based on PackageType.item_types
    # Query PackageItemType to get sort_order for each item type
    package_item_types = db.session.query(PackageItemTypeModel).filter_by(
        package_type_id=package_type_model.id
    ).all()

    item_type_to_package_item_type = {
        pit.item_type_id: pit for pit in package_item_types
    }

    items_dict = {}
    for item_type in package_type_model.item_types:
        package_item_type = item_type_to_package_item_type.get(item_type.id)
        if package_item_type:
            item = ItemModel(
                package_id=package.id,
                type_id=item_type.id,
                sort_order=package_item_type.sort_order,
                status=ItemStatus.NEW.value
            )
            db.session.add(item)
            db.session.flush()  # Flush to get item.id

            # Build items_dict for return value
            item_key = _get_item_key_from_type_name(item_type.name)
            items_dict[item_key] = item

            print(f"  ✓ Created item: {item_type.name} (ID: {item.id}, sort_order: {item.sort_order})")

    # Commit all changes
    db.session.commit()
    print(f"  ✓ Committed to database")

    print()
    print(f"✓ Package seeded successfully!")
    print(f"  - Package ID: {package.id}")
    print(f"  - Type: {package_type}")
    print(f"  - Items: {len(items_dict)}")
    print(f"  - Status: {[s for s in package.status]}")

    return package, items_dict


def _get_item_key_from_type_name(type_name: str) -> str:
    """Convert item type name to dictionary key.

    Args:
        type_name: Item type name from database

    Returns:
        str: Dictionary key for items_dict
    """
    type_name_lower = type_name.lower()

    if 'contact' in type_name_lower:
        return 'contact_info'
    elif 'consultation' in type_name_lower:
        return 'consultation_record'
    elif 'management plan' in type_name_lower:
        return 'management_plan'
    elif 'iem' in type_name_lower or 'independent environmental' in type_name_lower:
        return 'iem'
    else:
        # Fallback: use sanitized type name
        return type_name_lower.replace(' ', '_').replace('(', '').replace(')', '')


def _build_items_dict(items: list) -> dict:
    """Build items dictionary from list of items.

    Args:
        items: List of Item objects

    Returns:
        dict: Dictionary mapping item keys to Item objects
    """
    items_dict = {}
    for item in items:
        item_key = _get_item_key_from_type_name(item.type.name)
        items_dict[item_key] = item
    return items_dict
