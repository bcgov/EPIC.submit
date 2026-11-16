"""Resubmission invitation email is only queued when EAO staff create a new package version."""
from unittest.mock import MagicMock, Mock, patch

import pytest

from submit_api.models.user import UserType
from submit_api.services.package_service import PackageService
from submit_api.utils.constants import MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE

MODULE = "submit_api.services.package_service"


@pytest.mark.parametrize(
    "creator_type, expect_email",
    [(UserType.STAFF, True), (UserType.PROPONENT, False), (None, False)],
)
def test_resubmission_email_only_for_staff_created_version(creator_type, expect_email):
    """Staff-created versions invite the holder to resubmit; holder or unknown creators do not."""
    original_package = Mock(submitted_by=None, items=[])
    new_package = Mock(id=42)
    creator = Mock(type=creator_type) if creator_type else None

    with patch(f"{MODULE}.current_app", new=Mock()), \
            patch(f"{MODULE}.session_scope", return_value=MagicMock()), \
            patch(f"{MODULE}.PackageModel") as package_model, \
            patch(f"{MODULE}.PackageVersionService") as version_service, \
            patch(f"{MODULE}.ActivityLogService"), \
            patch(f"{MODULE}.TokenInfo"), \
            patch(f"{MODULE}.User") as user_model, \
            patch.object(PackageService, "create_new_package_from_original", return_value=new_package), \
            patch.object(PackageService, "_update_items_status"), \
            patch.object(PackageService, "_update_package_status"):
        package_model.find_by_id.return_value = original_package
        user_model.get_by_guid.return_value = creator

        PackageService.create_new_package_version_with_contacts(1)

    if expect_email:
        version_service.create_email_queue.assert_called_once()
        assert version_service.create_email_queue.call_args.args == (
            new_package.id, MANAGEMENT_PLAN_RESUBMISSION_REQUEST_EMAIL_TEMPLATE
        )
    else:
        version_service.create_email_queue.assert_not_called()
