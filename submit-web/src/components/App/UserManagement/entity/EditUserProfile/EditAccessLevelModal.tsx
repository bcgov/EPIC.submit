import { useEffect, useMemo } from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Info } from "@mui/icons-material";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { When } from "react-if";

import { AccountUserWithRole } from "@/models/AccountUser";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useUserEffectiveRole } from "@/hooks/useUserEffectiveRole";
import { modalStyle } from "@/components/Shared/Modals/constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import ControlledRadioGroup from "@/components/Shared/ControlledFormFields/ControlledRadioGroup";
import ControlledMultiSelect, {
  OptionType,
} from "@/components/Shared/ControlledFormFields/ControlledMultiSelect";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { UserRoleOptions } from "@/components/App/UserManagement/entity/NewUser/UserRoleOptions";
import {
  useSaveUserRole,
  useSaveUserStatus,
} from "@/hooks/api/useAccountUsers";
import {
  useGetAccountPackagesByAccountId,
  useGetAccountProjectsByAccount,
} from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { useUserStore } from "@/components/App/UserManagement/entity/userStore";
import { UserPackageStatus } from "@/components/App/UserStatusChip";
import Form from "@/components/Shared/Forms/common";

const REVOKE_VALUE = "REVOKE";

const editAccessSchema = yup.object().shape({
  role_name: yup.string().required("Please select a role."),
  original_package_ids: yup
    .array()
    .of(yup.string())
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
      then: (schema) => schema.min(1, "Please select at least one submission."),
      otherwise: (schema) => schema.notRequired(),
    }),
  project_ids: yup
    .array()
    .of(yup.string())
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN,
      then: (schema) => schema.min(1, "Please select at least one project."),
      otherwise: (schema) => schema.notRequired(),
    }),
});

type EditAccessSchema = yup.InferType<typeof editAccessSchema>;

// Wrapper component to prevent ControlledRadioGroup from passing `error` to a DOM element
function RevokeAccessOption({ error }: { error?: boolean }) {
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <SubmitRadio
          value={REVOKE_VALUE}
          label="Revoke Access"
          error={error}
        />
        <Tooltip
          title="Revoke removes the user's access to this project. They will no longer be able to log in or view submissions."
          arrow
        >
          <IconButton sx={{ p: 0, ml: -1 }}>
            <Info fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

interface EditAccessLevelModalProps {
  userData: AccountUserWithRole;
  onSuccess?: (updatedUser: AccountUserWithRole) => void;
  isCurrentUserAccountAdmin?: boolean;
}

export function EditAccessLevelModal({
  userData,
  onSuccess,
  isCurrentUserAccountAdmin = false,
}: EditAccessLevelModalProps) {
  const { setClose } = useModal();
  const { accountId } = useAccount();
  const { setSelectedUser } = useUserStore();
  const REVOKED_STATUS: UserPackageStatus = "ACCESS_REVOKED";
  const isRevoked = userData.status === REVOKED_STATUS;

  const { data: accountPackages } = useGetAccountPackagesByAccountId({
    accountId,
  });
  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId,
  });

  const effectiveRole = useUserEffectiveRole(userData.roles, accountProjects?.length);
  // Project Admins cannot assign Account Administrator role
  const excludedRoles = useMemo(
    () =>
      isCurrentUserAccountAdmin
        ? []
        : [USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN],
    [isCurrentUserAccountAdmin],
  );

  const accountUserId = userData.id || 0;

  const { mutate: updateRole, isPending: isPendingRole } = useSaveUserRole({
    account_user_id: accountUserId,
    options: {
      onSuccess: handleRoleSuccess,
      onError: handleError,
    },
  });

  const { mutate: updateStatus, isPending: isPendingStatus } =
    useSaveUserStatus({
      account_user_id: accountUserId,
      options: {
        onSuccess: handleStatusSuccess,
        onError: handleError,
      },
    });

  const methods = useForm<EditAccessSchema>({
    resolver: yupResolver(editAccessSchema),
    mode: "onSubmit",
    defaultValues: {
      role_name: isRevoked ? REVOKE_VALUE : (effectiveRole.role_name || ""),
      original_package_ids: [],
      project_ids: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = methods;

  const selectedRole = watch("role_name");

  const accountPackageOptions: OptionType[] = useMemo(
    () =>
      accountPackages?.flatMap((accountProject) =>
        Object.values(accountProject.packages).map((pkg) => ({
          value: String(pkg.original_package_id),
          label: pkg.name,
        })),
      ) || [],
    [accountPackages],
  );

  const accountProjectOptions: OptionType[] = useMemo(
    () =>
      accountProjects?.flatMap((accountProject) => ({
        value: String(accountProject.id),
        label: accountProject.project.name,
      })) || [],
    [accountProjects],
  );

  useEffect(() => {
    if (
      effectiveRole.original_package_ids.length > 0 &&
      accountPackages &&
      selectedRole === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR
    ) {
      const matchingPackageIds = accountPackages.flatMap((accountProject) =>
        Object.values(accountProject.packages)
          .filter((pkg) =>
            effectiveRole.original_package_ids.includes(pkg.original_package_id),
          )
          .map((pkg) => String(pkg.original_package_id)),
      );
      setValue("original_package_ids", matchingPackageIds);
    }
  }, [effectiveRole.original_package_ids, accountPackages, selectedRole, setValue]);

  useEffect(() => {
    if (
      effectiveRole.project_ids.length > 0 &&
      accountProjects &&
      selectedRole === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN
    ) {
      const matchingProjectIds = accountProjects
        .filter((ap) => effectiveRole.project_ids.includes(ap.id))
        .map((ap) => String(ap.id));
      setValue("project_ids", matchingProjectIds);
    }
  }, [effectiveRole.project_ids, accountProjects, selectedRole, setValue]);

  function handleRoleSuccess(updatedUser: AccountUserWithRole) {
    notify.success("Access level has been updated successfully", 10000);
    setSelectedUser(updatedUser);
    onSuccess?.(updatedUser);
    setClose();
  }

  function handleStatusSuccess(updatedUser: AccountUserWithRole) {
    // If we're reactivating, chain the role update
    const formData = methods.getValues();
    if (isRevoked && formData.role_name !== REVOKE_VALUE) {
      const roleName =
        formData.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN
          ? USER_MANAGEMENT_ROLE.PROJECT_ADMIN
          : formData.role_name;
      const request = buildRoleRequest(roleName, formData);
      updateRole(request);
      return;
    }
    // Otherwise this was a revoke action
    notify.success("Access has been revoked successfully", 10000);
    setSelectedUser(updatedUser);
    onSuccess?.(updatedUser);
    setClose();
  }

  function handleError(error?: Error) {
    const errorMessage = error?.message || "An unexpected error occurred.";
    notify.error(errorMessage);
  }

  function buildRoleRequest(roleName: string, formData: EditAccessSchema) {
    // Determine account_project_ids based on role
    let projectIds: number[];

    if (
      formData.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN &&
      formData.project_ids &&
      formData.project_ids.length > 0
    ) {
      // Specific project admin: use selected account_project_ids from dropdown
      projectIds = formData.project_ids.map(Number);
    } else if (
      roleName === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR
    ) {
      // Collaborator-Specific: derive account_project_ids from selected packages
      // accountPackages has project_id, we need to map to account_project_id via accountProjects
      const selectedPackageIds = new Set(
        formData.original_package_ids?.map(Number) || [],
      );
      const projectIdSet = new Set<number>();

      // Find which project_ids contain the selected packages
      const matchedProjectIds = new Set<string>();
      accountPackages?.forEach((ap) => {
        const projectPackages = Object.values(ap.packages);
        const hasSelectedPackage = projectPackages.some((pkg) =>
          selectedPackageIds.has(pkg.original_package_id),
        );
        if (hasSelectedPackage) {
          matchedProjectIds.add(String(ap.project_id));
        }
      });

      // Map project_ids to account_project_ids
      accountProjects?.forEach((ap) => {
        if (matchedProjectIds.has(String(ap.project_id))) {
          projectIdSet.add(ap.id);
        }
      });

      projectIds = Array.from(projectIdSet);
    } else {
      // Account Admin, Project Admin (all), Submission Admin (all): all projects
      projectIds = accountProjects?.map((ap) => ap.id) || [];
    }

    return {
      role_name: roleName,
      account_project_ids: projectIds,
      original_package_ids: formData.original_package_ids
        ? formData.original_package_ids.map(Number)
        : undefined,
    };
  }

  function onSubmit(formData: EditAccessSchema) {
    if (formData.role_name === REVOKE_VALUE) {
      updateStatus({ active: false });
      return;
    }

    // If user is currently revoked, reactivate first then update role
    if (isRevoked) {
      updateStatus({ active: true });
      return;
    }

    // SPECIFIC_PROJECT_ADMIN maps to PROJECT_ADMIN on backend
    const roleName =
      formData.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN
        ? USER_MANAGEMENT_ROLE.PROJECT_ADMIN
        : formData.role_name;

    const request = buildRoleRequest(roleName, formData);
    updateRole(request);
  }

  const isPending = isPendingRole || isPendingStatus;

  return (
    <Box sx={{ ...modalStyle, width: "min(95vw, 700px)", overflowY: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <DialogTitle>Edit Access Level</DialogTitle>
        <IconButton onClick={setClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ width: "100%" }} />
      <FormProvider {...methods}>
        <Form
          onSubmit={handleSubmit(onSubmit)}
          methods={methods}
          style={{ width: "100%" }}
        >
          <DialogContent sx={{padding: "20px 16px"}}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>
              What Role would you like to assign this User?
            </Typography>
            <ControlledRadioGroup name="role_name">
              <UserRoleOptions
                error={Boolean(errors["role_name"])}
                excludeRoles={excludedRoles}
                selectedRole={selectedRole}
                selectionsNode={
                  <>
                    <When
                      condition={
                        selectedRole ===
                        USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR
                      }
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        Which Submission(s) would you like to assign that user
                        to?
                      </Typography>
                      <ControlledMultiSelect
                        multiple
                        name="original_package_ids"
                        options={accountPackageOptions}
                      />
                    </When>
                    <When
                      condition={
                        selectedRole ===
                        USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN
                      }
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        Which Project(s) would you like to assign this user
                        to?
                      </Typography>
                      <ControlledMultiSelect
                        multiple
                        name="project_ids"
                        options={accountProjectOptions}
                      />
                    </When>
                  </>
                }
              />
              <RevokeAccessOption error={Boolean(errors["role_name"])} />
            </ControlledRadioGroup>
          </DialogContent>
          <Divider sx={{ width: "100%" }} />
          <DialogActions sx={{ padding: "1rem",justifyContent: "flex-start" }}>
            <Button
              onClick={setClose}
              color="secondary"
              sx={{ border: 0 }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isPending}
              variant="contained"
            >
              Save
            </LoadingButton>
          </DialogActions>
        </Form>
      </FormProvider>
    </Box>
  );
}

export default EditAccessLevelModal;
