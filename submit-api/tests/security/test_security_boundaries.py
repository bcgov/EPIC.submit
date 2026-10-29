"""Isolated security regressions. No application factory, database, or external services.

Run: PYTHONPATH=src pytest --confcutdir=tests/security tests/security -o addopts=''
"""
from contextlib import nullcontext
from inspect import unwrap
from types import SimpleNamespace as NS
from unittest.mock import Mock

import pytest
from flask import Flask, g
from marshmallow import ValidationError
from werkzeug.exceptions import Unauthorized

from submit_api.auth import jwt
from submit_api.enums.role import RoleEnum
from submit_api.exceptions import PermissionDeniedError, ResourceNotFoundError, BadRequestError
from submit_api.models.user import UserType
from submit_api.models.invitations import Invitations
from submit_api.schemas.account_user import EditAccountUserSchema
from submit_api.services import authorization, account_user_service as users, invitation_service as invites
from submit_api.services.proponent_service import ProponentService
from submit_api.resources import proponent, invitation, package, activity_log, geo, account, project


@pytest.fixture(autouse=True)
def context():
    app = Flask(__name__)
    with app.test_request_context():
        g.token_info = {"preferred_username": "actor"}
        g.jwt_oidc_token_info = g.token_info
        yield app


def role(name=RoleEnum.PROJECT_ADMIN.value, project_id=10):
    return NS(role=NS(role_name=name), account_project_id=project_id, active=True)


def identities(monkeypatch, actor_roles=None, target_roles=None, target_account=1):
    actor = NS(id=1, account_id=1, roles=actor_roles or [role()])
    target = NS(id=2, account_id=target_account, roles=target_roles or [role()])
    target.all_roles = target.roles
    monkeypatch.setattr(users.UserModel, 'get_by_guid', Mock(return_value=NS(type=UserType.PROPONENT, account_user=actor)))
    monkeypatch.setattr(users.AccountUserModel, 'get_users_by_account_user_id', Mock(return_value=target))
    return actor, target


@pytest.mark.parametrize('field', ['id', 'user_id', 'account_id', 'invitation_id', 'roles', 'has_agreed_to_terms'])
def test_profile_rejects_privileged_fields(field):
    with pytest.raises(ValidationError):
        EditAccountUserSchema().load({field: 1})


def test_profile_allows_ui_contact_fields():
    payload = dict(first_name='A', last_name='B', position='Manager', work_email_address='a@example.org',
                   work_contact_number='2505551234', extension_number='123', company_name='Company')
    assert EditAccountUserSchema().load(payload) == payload


def test_profile_cannot_edit_other_identity(monkeypatch):
    lookup = Mock()
    monkeypatch.setattr(users.AccountUserModel, 'get_by_guid', lookup)
    with pytest.raises(PermissionDeniedError):
        users.AccountUserService.update_account_user('victim', {'first_name': 'Changed'})
    lookup.assert_not_called()


def test_profile_self_edit(monkeypatch):
    person = NS(id=1, first_name='Old')
    monkeypatch.setattr(users.AccountUserModel, 'get_by_guid', Mock(return_value=person))
    database = Mock()
    monkeypatch.setattr(users, 'db', database)
    assert users.AccountUserService.update_account_user('actor', {'first_name': 'New'}) is person
    assert person.first_name == 'New'
    database.session.commit.assert_called_once()


@pytest.mark.parametrize('target_account,allowed', [(1, True), (2, False)])
def test_account_read_scope(monkeypatch, target_account, allowed):
    identities(monkeypatch)
    if allowed:
        authorization.check_account_access(target_account)
    else:
        with pytest.raises(PermissionDeniedError):
            authorization.check_account_access(target_account)


@pytest.mark.parametrize('primary', [True, False])
def test_admin_cannot_change_other_company(monkeypatch, primary):
    identities(monkeypatch, actor_roles=[role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value if primary else RoleEnum.PROJECT_ADMIN.value)], target_account=2)
    with pytest.raises(PermissionDeniedError):
        users.AccountUserService._validate_user_permission('actor', 2)


def test_project_admin_can_manage_own_project(monkeypatch):
    identities(monkeypatch)
    users.AccountUserService._validate_user_permission('actor', 2, RoleEnum.SUBMISSION_ADMIN.value)


def test_project_admin_cannot_change_multi_project_user(monkeypatch):
    identities(monkeypatch, target_roles=[role(), role(project_id=20)])
    with pytest.raises(PermissionDeniedError):
        users.AccountUserService._validate_user_permission('actor', 2)


def test_account_admin_can_manage_multi_project_user(monkeypatch):
    identities(monkeypatch, actor_roles=[role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)], target_roles=[role(), role(project_id=20)])
    users.AccountUserService._validate_user_permission('actor', 2)


@pytest.mark.parametrize('foreign_project,foreign_package', [(True, False), (False, True)])
def test_role_assignment_rejected_before_deletion(monkeypatch, foreign_project, foreign_package):
    identities(monkeypatch, actor_roles=[role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)])
    monkeypatch.setattr(users.RoleModel, 'get_by_name', Mock(return_value=NS(id=1)))
    monkeypatch.setattr(users.AccountProjectModel, 'get_all_in_ids', Mock(return_value=[NS(id=10, account_id=2 if foreign_project else 1)]))
    monkeypatch.setattr(users.PackageModel, 'find_by_id', Mock(return_value=NS(account_project_id=20)))
    delete = Mock()
    monkeypatch.setattr(users.UserRoleModel, 'delete_all_by_account_user_id', delete)
    with pytest.raises(PermissionDeniedError):
        users.AccountUserService.update_role('actor', 2, dict(role_name=RoleEnum.PROJECT_ADMIN.value,
            account_project_ids=[10], original_package_ids=[100] if foreign_package else []))
    delete.assert_not_called()


def test_invitation_acceptance_uses_authenticated_identity(monkeypatch):
    invite = NS(account_id=1, project_ids=[], eligible_entries=None)
    monkeypatch.setattr(invites.InvitationsModel, 'validate_token', Mock(return_value=invite))
    monkeypatch.setattr(invites.TermsOfServiceModel, 'get_active_terms_of_service_by_version', Mock(return_value=NS(id=1)))
    monkeypatch.setattr(invites.User, 'get_by_guid', Mock(return_value=None))
    monkeypatch.setattr(invites, 'session_scope', lambda: nullcontext(Mock()))
    created = Mock(return_value=NS(id=3))
    monkeypatch.setattr(invites.InvitationService, '_create_user', created)
    monkeypatch.setattr(invites.InvitationService, '_create_account_user', Mock(return_value=NS(id=4, user_id=3)))
    for method in ['get_or_create_account_projects', '_update_proponent_status_by_account']:
        monkeypatch.setattr(invites.InvitationService, method, Mock())
    monkeypatch.setattr(invites.AccountProjectModel, 'get_all_in_project_ids', Mock(return_value=[]))
    monkeypatch.setattr(invites.InvitationsModel, 'mark_used', Mock())
    invites.InvitationService.accept_invitation('secret', {'auth_guid': 'victim', 'has_agreed_to_terms': True, 'terms_of_service_version_id': 1})
    assert created.call_args.args[0]['auth_guid'] == 'actor'


def test_anonymous_invitation_service_rejected():
    g.token_info = {}
    g.jwt_oidc_token_info = {}
    with pytest.raises(PermissionDeniedError):
        invites.InvitationService.accept_invitation('secret', {})


def test_invitation_serializer_omits_secret_by_default():
    obj = Invitations(token='secret')
    assert 'token' not in obj.to_dict()
    assert obj.to_dict(include_token=True)['token'] == 'secret'


def test_invitation_registration_details_are_scoped(monkeypatch):
    monkeypatch.setattr(Invitations, 'validate_token', Mock(return_value=NS(is_deleted=False,
        account=NS(proponent_id=1), account_id=2, eligible_entries=[{'project_id': 10, 'work_ids': [3]}])))
    from submit_api.services import proponent_service as ps
    monkeypatch.setattr(ps.Proponent, 'get_by_id', Mock(return_value=NS(id=1, name='Company')))
    allowed = dict(project_id=10, work_id=3, non_work_item_type=None)
    denied = dict(project_id=20, work_id=4, non_work_item_type=None)
    monkeypatch.setattr(ProponentService, '_get_eligibility_entries', Mock(return_value={'eligibility_entries': [allowed, denied]}))
    assert ProponentService.get_invitation_proponent('secret') == dict(id=1, name='Company', eligibility_entries=[allowed])


def test_expired_invitation_cannot_fetch_company(monkeypatch):
    monkeypatch.setattr(Invitations, 'validate_token', Mock(return_value=None))
    with pytest.raises(ResourceNotFoundError):
        ProponentService.get_invitation_proponent('expired')


@pytest.mark.parametrize('resource,args', [(proponent.AllProponents.get, ()), (proponent.Proponent.get, (1,)),
    (package.PackageVersions.get, (1,)), (activity_log.ActivityLog.get, ('PACKAGE', 1)),
    (invitation.InvitationDetailResource.post, (None, 'secret')),
    (account.Accounts.post, ()), (project.ProjectsByAccount.post, (1,))])
def test_routes_reject_missing_bearer_token(resource, args):
    # Exercise the actual decorator stack; no JWT/authorization mocking.
    with pytest.raises(Exception) as caught:
        resource(*args)
    assert getattr(caught.value, 'status_code', None) == 401 or getattr(caught.value, 'code', None) == 401


def test_geo_unscoped_list_rejected():
    with pytest.raises(BadRequestError):
        unwrap(geo.GeoUploads.get)()


def test_geo_foreign_upload_rejected_before_url_generation(monkeypatch):
    monkeypatch.setattr(geo, '_check_upload_access', Mock(side_effect=PermissionDeniedError('Denied')))
    read = Mock()
    monkeypatch.setattr(geo.GeoService, 'get_presigned_read_url', read)
    with pytest.raises(PermissionDeniedError):
        unwrap(geo.GeoUploadUrl.get)(9)
    read.assert_not_called()


def test_geo_known_upload_resolves_owning_package(monkeypatch):
    monkeypatch.setattr(geo, 'db', NS(session=NS(get=Mock(return_value=NS(raw_s3_key='owned')))))
    check = Mock()
    monkeypatch.setattr(geo, '_check_key_access', check)
    geo._check_upload_access(9)
    check.assert_called_once_with('owned')


def test_missing_user_has_controlled_authorization_error(monkeypatch):
    monkeypatch.setattr(authorization.UserModel, 'get_by_guid', Mock(return_value=None))
    with pytest.raises(Unauthorized):
        authorization.check_has_permissions_on_project(account_project_ids=[1])


def test_project_admin_cannot_reactivate_former_primary_admin(monkeypatch):
    _, target = identities(monkeypatch)
    target.roles = []
    target.all_roles = [role(RoleEnum.ACCOUNT_PRIMARY_ADMIN.value)]
    with pytest.raises(PermissionDeniedError):
        users.AccountUserService._validate_user_permission('actor', 2)


@pytest.mark.parametrize('capability,allowed', [('eao_create', True), ('full_access', True), ('eao_view', False)])
def test_staff_invitation_management_requires_create(monkeypatch, capability, allowed):
    from submit_api.utils.roles import EpicSubmitRole
    claims_role = {'eao_create': EpicSubmitRole.EAO_CREATE.value, 'full_access': EpicSubmitRole.FULL_ACCESS.value,
                   'eao_view': EpicSubmitRole.EAO_VIEW.value}[capability]
    monkeypatch.setattr(invites.User, 'get_by_guid', Mock(return_value=NS(type=UserType.STAFF)))
    monkeypatch.setattr(invites.jwt, 'contains_role', lambda roles: claims_role in roles)
    if allowed:
        invites.InvitationService._check_action_authorized([5], [NS(id=10)])
    else:
        with pytest.raises(PermissionDeniedError):
            invites.InvitationService._check_action_authorized([5], [NS(id=10)])


@pytest.mark.parametrize('can_create', [True, False])
def test_staff_copy_link_only_for_invitation_managers(monkeypatch, can_create):
    from submit_api.services import proponent_service as ps
    monkeypatch.setattr(ps.jwt, 'contains_role', Mock(return_value=can_create))
    monkeypatch.setattr(ps.Invitations, 'get_all_in_account_ids', Mock(return_value=[Invitations(token='secret')]))
    result = ProponentService._get_invitations([1])[0]
    assert ('token' in result) == can_create


@pytest.mark.parametrize('handler,args', [(account.Accounts.post, ()), (project.ProjectsByAccount.post, (1,))])
def test_logged_in_non_staff_cannot_create_account_or_attach_projects(monkeypatch, handler, args):
    from submit_api.auth import Auth
    monkeypatch.setattr(jwt, '_require_auth_validation', Mock(return_value={}))
    monkeypatch.setattr(Auth, '_reject_if_revoked', Mock())
    monkeypatch.setattr(jwt, 'contains_role', Mock(return_value=False))
    with pytest.raises(Exception) as caught:
        handler(*args)
    assert caught.value.status_code == 401


def test_geo_authorized_url_still_works(monkeypatch):
    check = Mock()
    monkeypatch.setattr(geo, '_check_upload_access', check)
    monkeypatch.setattr(geo.GeoService, 'get_presigned_read_url', Mock(return_value={'url': 'authorized-url'}))
    result, status = unwrap(geo.GeoUploadUrl.get)(9)
    assert status == 200 and result['url'] == 'authorized-url'
    check.assert_called_once_with(9)


def test_proponent_history_excludes_staff_logs(monkeypatch):
    monkeypatch.setattr(activity_log.authorization, 'has_access_to_package', Mock())
    monkeypatch.setattr(activity_log.jwt, 'contains_role', Mock(return_value=False))
    fetch = Mock(return_value=[])
    monkeypatch.setattr(activity_log.ActivityLogService, 'get_activity_logs', fetch)
    unwrap(activity_log.ActivityLog.get)('PACKAGE', 7)
    fetch.assert_called_once_with('PACKAGE', 7, for_staff=False)


def test_project_pagination_filters_account_and_roles_before_count(monkeypatch):
    from submit_api.models.queries.account_project import ProjectQueries
    query = Mock()
    query.filter.return_value = query
    query.add_columns.return_value = query
    query.order_by.return_value = query
    query.distinct.return_value = query
    query.paginate.return_value = NS(items=[], total=0)
    actor = NS(account_user=NS(account_id=5, roles=[role(project_id=10)]))
    monkeypatch.setattr(ProjectQueries, '_filter_by_search_criteria', Mock(return_value=query))
    monkeypatch.setattr(ProjectQueries, 'get_full_account_projects', Mock(return_value=[]))
    monkeypatch.setattr(ProjectQueries, '_filter_packages_by_user_access', Mock(return_value=[]))
    assert ProjectQueries.get_filtered_account_projects_paginated(page=1, page_size=10, user=actor) == ([], 0)
    expressions = query.filter.call_args.args
    compiled = [str(e.compile(compile_kwargs={'literal_binds': True})) for e in expressions]
    assert 'account_projects.id IN (10)' in compiled
    assert 'account_projects.account_id = 5' in compiled
    calls = [c[0] for c in query.mock_calls]
    assert calls.index('filter') < calls.index('paginate')


def test_project_status_filter_runs_before_pagination(monkeypatch):
    from submit_api.models.queries.account_project import ProjectQueries
    query = Mock()
    query.filter.return_value = query
    query.add_columns.return_value = query
    query.order_by.return_value = query
    query.distinct.return_value = query
    query.all.return_value = []
    actor = NS(account_user=NS(account_id=5, roles=[role(project_id=10)]))
    monkeypatch.setattr(ProjectQueries, '_filter_by_search_criteria', Mock(return_value=query))
    monkeypatch.setattr(ProjectQueries, 'get_full_account_projects', Mock(return_value=[]))
    monkeypatch.setattr(ProjectQueries, '_filter_packages_by_user_access', Mock(return_value=[]))
    monkeypatch.setattr(ProjectQueries, '_filter_packages_by_computed_status', Mock(return_value=[{'id': 1}, {'id': 2}, {'id': 3}]))
    result = ProjectQueries.get_filtered_account_projects_paginated(search_options=NS(status=['NEW']), page=2, page_size=2, user=actor)
    assert result == ([{'id': 3}], 3)
    query.paginate.assert_not_called()


@pytest.mark.parametrize('proponent_id,allowed', [(1, True), (2, False)])
def test_bulk_project_association_preserves_company_boundary(monkeypatch, proponent_id, allowed):
    from submit_api.services import project_service as ps
    monkeypatch.setattr(ps.AccountModel, 'find_by_id', Mock(return_value=NS(proponent_id=1)))
    monkeypatch.setattr(ps.ProjectModel, 'get_all_projects_in_ids', Mock(return_value=[NS(id=10, proponent_id=proponent_id)]))
    add = Mock()
    monkeypatch.setattr(ps.AccountProjectModel, 'add_projects_bulk', add)
    if allowed:
        ps.ProjectService.bulk_add_projects(1, [10])
        add.assert_called_once_with([{'account_id': 1, 'project_id': 10}])
    else:
        with pytest.raises(BadRequestError):
            ps.ProjectService.bulk_add_projects(1, [10])
        add.assert_not_called()


def test_maintenance_sql_binds_values_and_quotes_identifiers(monkeypatch):
    from sqlalchemy.dialects.postgresql import dialect
    from submit_api.resources import migration_ops as ops
    malicious_name = 'table"; DROP TABLE users; --'
    database = Mock()
    database.engine.dialect = dialect()
    database.session.execute.return_value = NS(fetchall=lambda: [(malicious_name, 'constraint"name', 'user"column')], rowcount=1)
    monkeypatch.setattr(ops, 'db', database)
    username = "name'; DROP TABLE users; --"
    monkeypatch.setattr(ops.AuthService, 'get_users', Mock(return_value=[{'id': 'old-id', 'username': username}]))
    _, status = unwrap(ops.MigrateUserIdsToUsernames.post)()
    assert status == 200
    updates = [c for c in database.session.execute.call_args_list if str(c.args[0]).lstrip().startswith('UPDATE')]
    assert updates
    for call in updates:
        sql = str(call.args[0])
        assert username not in sql and 'old-id' not in sql
        assert call.args[1] == {'old_0': 'old-id', 'new_0': username}
    alter_statements = [str(c.args[0]) for c in database.session.execute.call_args_list if 'ALTER TABLE' in str(c.args[0])]
    assert all('"table""; DROP TABLE users; --"' in sql for sql in alter_statements)
    database.session.commit.assert_called_once()


@pytest.mark.parametrize('package_ids,permitted', [([], False), ([10], True), ([10, 20], False)])
def test_geo_key_requires_access_to_every_attached_package(monkeypatch, package_ids, permitted):
    query = Mock()
    query.join.return_value = query
    query.filter.return_value = query
    query.all.return_value = [NS(item=NS(package_id=p)) for p in package_ids]
    monkeypatch.setattr(geo, 'Submission', NS(query=query))
    def check(package_id):
        if package_id != 10:
            raise PermissionDeniedError('Other company')
    monkeypatch.setattr(geo.authorization, 'has_access_to_package', check)
    if permitted:
        geo._check_key_access('document-key')
    else:
        with pytest.raises(PermissionDeniedError):
            geo._check_key_access('document-key')


def test_same_account_role_update_preserves_existing_write_flow(monkeypatch):
    _, target = identities(monkeypatch)
    target.user_id = 3
    target.to_dict = lambda: {'user_id': 3}
    monkeypatch.setattr(users.RoleModel, 'get_by_name', Mock(return_value=NS(id=7)))
    monkeypatch.setattr(users.AccountProjectModel, 'get_all_in_ids', Mock(return_value=[NS(id=10, account_id=1)]))
    delete, create = Mock(), Mock()
    monkeypatch.setattr(users.UserRoleModel, 'delete_all_by_account_user_id', delete)
    monkeypatch.setattr(users.UserRoleModel, 'create_user_role', create)
    monkeypatch.setattr(users.AccountUserService, '_fetch_user_status_name', Mock(return_value='ACTIVE'))
    monkeypatch.setattr(users, 'db', Mock())
    users.AccountUserService.update_role('actor', 2, dict(role_name=RoleEnum.SUBMISSION_ADMIN.value, account_project_ids=[10]))
    delete.assert_called_once_with(2)
    create.assert_called_once_with(dict(account_user_id=2, role_id=7, account_project_id=10, package_ids=None, original_package_ids=None))


@pytest.mark.parametrize('can_create', [True, False])
def test_generic_invitation_permission_checks_staff_claims(monkeypatch, can_create):
    from submit_api.auth import Auth
    from submit_api.enums.role import ProponentPermissionsEnum
    from submit_api.utils.roles import EpicSubmitRole
    monkeypatch.setattr(jwt, '_require_auth_validation', Mock(return_value={}))
    monkeypatch.setattr(Auth, '_reject_if_revoked', Mock())
    monkeypatch.setattr(Auth, 'get_current_user', Mock(return_value=NS(type=UserType.STAFF)))
    claim = EpicSubmitRole.EAO_CREATE.value if can_create else EpicSubmitRole.EAO_VIEW.value
    monkeypatch.setattr(jwt, 'contains_role', lambda roles: claim in roles)
    protected = Auth.has_one_of_roles([ProponentPermissionsEnum.INVITE_USERS.value])(lambda: 'allowed')
    if can_create:
        assert protected() == 'allowed'
    else:
        with pytest.raises(PermissionDeniedError):
            protected()
