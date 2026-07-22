"""Local conftest to disable DB-dependent fixtures for pure-mock tests."""
import pytest


@pytest.fixture(autouse=True)
def app_context():
    """Override the global autouse app_context fixture - no DB needed."""
    yield


@pytest.fixture(scope="session", autouse=True)
def cleanup_database():
    """Override the global session-scoped cleanup_database fixture - no DB needed."""
    yield
