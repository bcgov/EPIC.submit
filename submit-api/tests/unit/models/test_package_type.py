"""Test PackageType model ORM methods."""
from submit_api.enums.package_type import PackageApprovalType, PackageTypeEnum
from submit_api.models.package_type import PackageType
from tests.utilities.factory_utils import factory_package_model, factory_track_phase


def test_find_by_name(session):
    """Returns the package type matching the given name."""
    package = factory_package_model()
    pt = PackageType.find_by_id(package.type_id)
    result = PackageType.find_by_name(pt.name)
    assert result.id == pt.id


def test_find_by_name_not_found(session):
    """Returns None when no package type matches the given name."""
    result = PackageType.find_by_name('Nonexistent Package Type')
    assert result is None


def _make_phase_range_type(session, start, end, label=None):
    """Persist a package type bound to a start/end phase pair."""
    package_type = PackageType(
        name=f"Range {start.id}-{end.id}", title="Range", start_phase_id=start.id,
        end_phase_id=end.id, phase_label=label)
    session.add(package_type)
    session.flush()
    return package_type


def test_find_by_phase_id_matches_start_and_end_phase(session):
    """A package type is found for both its start phase and its end phase, but not for others."""
    start, end, other = (factory_track_phase(session) for _ in range(3))
    package_type = _make_phase_range_type(session, start, end)

    assert package_type.id in [p.id for p in PackageType.find_by_phase_id(start.id)]
    assert package_type.id in [p.id for p in PackageType.find_by_phase_id(end.id)]
    assert package_type.id not in [p.id for p in PackageType.find_by_phase_id(other.id)]


def test_find_by_phase_id_ignores_phase_without_enable_submit(session):
    """A phase with enable_submit off yields no package types, even if one is configured for it."""
    start = factory_track_phase(session, enable_submit=False)
    end = factory_track_phase(session, enable_submit=True)
    package_type = _make_phase_range_type(session, start, end)

    assert PackageType.find_by_phase_id(start.id) == []
    assert package_type.id in [p.id for p in PackageType.find_by_phase_id(end.id)]


def test_find_by_phase_id_unknown_phase_returns_empty(session):
    """An unknown phase id yields no package types."""
    assert PackageType.find_by_phase_id(-1) == []


def test_find_by_name_and_phases(session):
    """Lookup by name and phase pair finds the matching type; a different pair returns None."""
    start, end = factory_track_phase(session), factory_track_phase(session)
    package_type = _make_phase_range_type(session, start, end)

    assert PackageType.find_by_name_and_phases(package_type.name, start.id, end.id).id == package_type.id
    assert PackageType.find_by_name_and_phases(package_type.name, start.id, start.id) is None


def test_matches_phase_and_has_phase():
    """matches_phase is true only for the start and end phase; phase-less types have no phase."""
    ranged = PackageType(name="R", start_phase_id=1, end_phase_id=2)
    phaseless = PackageType(name="P")

    assert ranged.has_phase
    assert ranged.matches_phase(1) and ranged.matches_phase(2)
    assert not ranged.matches_phase(3)
    assert not ranged.matches_phase(None)
    assert not phaseless.has_phase
    assert not phaseless.matches_phase(1)


def test_report_type_b_is_not_seeded(session):
    """The retired Report_TypeB package type no longer exists."""
    assert PackageType.find_by_name('Report_TypeB') is None


def test_report_type_uses_verify_only_flow(session):
    """The regular Report type keeps the Verify-only (A) flow and is not versioned."""
    report_type = PackageType.find_by_name(PackageTypeEnum.REPORT.value)
    assert report_type is not None
    assert report_type.approval_type == PackageApprovalType.A
    assert report_type.versioning_enabled is False
