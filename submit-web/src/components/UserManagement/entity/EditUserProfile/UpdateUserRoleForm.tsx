import { useEffect, useState } from "react";
import { TableBox } from "../../../Shared/TableBox";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { AccountUserWithRole } from "@/models/AccountUser";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "../../../../components/UserStatusChip";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { FormOptions } from "../NewUser/FormOptions";
import { FormProvider, useForm } from "react-hook-form";
import Form from "@/components/Shared/Forms/common";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useSaveUserRole,
  useSaveUserStatus,
} from "@/hooks/api/useAccountUsers";
import { useNavigate } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { When } from "react-if";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import ControlledMultiSelect, {
  OptionType,
} from "@/components/Shared/controlled/ControlledMultiSelect";
import { useGetAccountPackagesByAccountId } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { useMemo } from "react";
import { UserPackageStatus } from "@/components/UserStatusChip";
import { useModal } from "@/components/Shared/Modals/modalStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { useUserStore } from "./../../entity/userStore";

const userSchema = yup.object().shape({
  role_name: yup.string().required("Please select a role."),
  package_ids: yup
    .array()
    .of(yup.string())
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
      then: (schema) => schema.min(1, "Please select at least one project."),
      otherwise: (schema) => schema.notRequired(),
    }),
});

type UserSchema = yup.InferType<typeof userSchema>;

interface UpdateUserRoleProps {
  userData: AccountUserWithRole;
}

function UpdateUserRole({ userData }: UpdateUserRoleProps) {
  const { selectedUser, setSelectedUser } = useUserStore();
  const { accountId } = useAccount();
  const [user, setUser] = useState(userData);
  const navigate = useNavigate();
  const onCreateFailure = (error?: Error) => {
    const errorMessage = error?.message || "An unexpected error occurred.";
    notify.error(errorMessage);
  };

  const onCreateSuccess = (updatedUser: AccountUserWithRole) => {
    notify.success("User role updated successfully");
    setUser(updatedUser);
    navigate({ to: "/proponent/user-management" });
  };

  const account_user_id = user.id || 0;
  const { mutate: updateUser, isPending: isPendingUpdate } = useSaveUserRole({
    account_user_id,
    options: {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    },
  });

  const onUpdateStatusFailure = (error?: Error) => {
    setCloseModal();
    const errorMessage = error?.message || "An unexpected error occurred.";
    notify.error(errorMessage);
  };

  const onUpdateStatusSuccess = (updatedStatusUser: AccountUserWithRole) => {
    setCloseModal();
    notify.success("User status updated successfully");
    if (selectedUser) {
      setSelectedUser(updatedStatusUser);
    }
    setUser(updatedStatusUser);
    navigate({ to: "/proponent/user-management/user-details" });
  };

  const { mutate: updateUserStatus, isPending: isPendingStatusUpdate } =
    useSaveUserStatus({
      account_user_id,
      options: {
        onSuccess: onUpdateStatusSuccess,
        onError: onUpdateStatusFailure,
      },
    });

  const ACTIVE_STATUS: UserPackageStatus = "ACTIVE";

  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
    setIsLoading,
  } = useModal();

  const handleSwitchChange = () => {
    const isEnabling = user.status !== ACTIVE_STATUS; // if currently not active, we are enabling
    openConfirmationModal(isEnabling);
  };

  const handleConfirm = () => {
    const request = {
      active: user.status === ACTIVE_STATUS ? false : true,
    };
    updateUserStatus(request);
  };

  useEffect(() => {
    setIsLoading(isPendingStatusUpdate);
  }, [isPendingStatusUpdate, setIsLoading]);

  const openConfirmationModal = (isEnabling: boolean) => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={handleConfirm}
        title={isEnabling ? "Enable User" : "Disable User"}
        description={
          isEnabling
            ? "You are activating this user. They will regain access to your project and submissions.\nPlease confirm the activation of this user."
            : "You are deactivating this user. If you go ahead, this user will lose all access to your project and submissions.\nPlease confirm the deactivation of this user."
        }
        confirmText="Confirm"
        cancelText="Cancel"
      />
    );
  };

  const methods = useForm<UserSchema>({
    resolver: yupResolver(userSchema),
    mode: "onSubmit",
    defaultValues: {
      role_name: user.role?.role_name || "",
      package_ids: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const selectedRole = watch("role_name");

  const { data: accountPackages } = useGetAccountPackagesByAccountId({
    accountId: accountId,
  });

  const handleUpdateForm = (formData: UserSchema) => {
    const request = {
      role_name: formData.role_name,
      package_ids: formData.package_ids
        ? formData.package_ids.map(Number)
        : undefined,
    };
    updateUser(request);
  };

  const options: OptionType[] = useMemo(
    () =>
      accountPackages?.flatMap((accountProject) =>
        Object.values(accountProject.packages).map((pkg) => ({
          value: String(pkg.id),
          label: pkg.name,
        }))
      ) || [],
    [accountPackages]
  );

  useEffect(() => {
    if (
      user.role?.package_ids &&
      accountPackages &&
      selectedRole === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR
    ) {
      const matchingPackageIds = accountPackages.flatMap((accountProject) =>
        Object.values(accountProject.packages)
          .filter((pkg) => user.role.package_ids.includes(pkg.id))
          .map((pkg) => String(pkg.id))
      );

      methods.setValue("package_ids", matchingPackageIds);
    }
  }, [user.role?.package_ids, accountPackages, selectedRole, methods]);

  return (
    <TableBox mainLabel={"User Management"}>
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(handleUpdateForm)} methods={methods}>
          <Paper
            sx={{
              maxWidth: "1448px",
              minHeight: "500px",
              border: `1px solid ${BCDesignTokens.themeGray40}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "auto",
                padding: "12px 20px",
              }}
            >
              <Grid container direction="row" alignItems="center" spacing={1}>
                <Grid item xs={10}>
                  <Typography variant="h5" sx={{ fontWeight: 400 }}>
                    {user.full_name}
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={2}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <Typography color={BCDesignTokens.themeGray70}>
                    Status:
                  </Typography>
                  <UserStatusChip status={user.status} />
                </Grid>
              </Grid>
            </Box>
            <UserInfoBox userData={user} showEdit={false} />
            <Container
              sx={{
                pb: BCDesignTokens.layoutPaddingSmall,
                alignSelf: "flex-start",
                m: 0,
                marginTop: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: BCDesignTokens.themeBlue100,
                  fontWeight: 700,
                }}
              >
                Select Role
              </Typography>
              <Divider
                sx={{ backgroundColor: BCDesignTokens.themeGold100, height: 1 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: BCDesignTokens.layoutMarginMedium,
                  mb: BCDesignTokens.layoutMarginSmall,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  What Role would you like to assign this User?
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.status === ACTIVE_STATUS}
                      onChange={handleSwitchChange}
                      sx={{
                        "& .MuiSwitch-switchBase": {
                          color: BCDesignTokens.supportBorderColorDanger, // thumb color when unchecked
                        },
                        "& .MuiSwitch-track": {
                          backgroundColor:
                            BCDesignTokens.supportBorderColorDanger, // track color when unchecked
                        },
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: BCDesignTokens.supportBorderColorSuccess, // thumb color when checked
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor:
                              BCDesignTokens.supportBorderColorSuccess, // track color when checked
                          },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      User Account Active
                    </Typography>
                  }
                  labelPlacement="start"
                  sx={{
                    ml: 2,
                    ".MuiFormControlLabel-label": { fontWeight: 600 },
                  }}
                />
              </Box>
              <ControlledRadioGroup name="role_name">
                <FormOptions error={Boolean(errors["role_name"])} />
              </ControlledRadioGroup>

              <When
                condition={
                  selectedRole ===
                  USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR
                }
              >
                <Typography sx={{ fontWeight: 700 }}>
                  Which Submission(s) would you like to assign that user to?
                </Typography>
                <ControlledMultiSelect
                  multiple
                  name="package_ids"
                  options={options}
                />
              </When>

              <Stack direction="row" sx={{ mt: 2 }}>
                <LoadingButton type="submit" loading={isPendingUpdate}>
                  Save
                </LoadingButton>
                <Button
                  variant="text"
                  onClick={() => navigate({ to: "/proponent/user-management" })}
                >
                  Cancel
                </Button>
              </Stack>
            </Container>
          </Paper>
        </Form>
      </FormProvider>
    </TableBox>
  );
}

export default UpdateUserRole;
