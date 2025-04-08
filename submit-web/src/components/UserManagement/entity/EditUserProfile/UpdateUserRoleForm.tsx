import { useEffect, useState } from "react";
import { TableBox } from "../../../Shared/TableBox";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
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
import { useSaveUserRole } from "@/hooks/api/useAccountUsers";
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
        })),
      ) || [],
    [accountPackages],
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
          .map((pkg) => String(pkg.id)),
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
                  <Typography variant="h2" sx={{ fontWeight: 400 }}>
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
              maxWidth="sm"
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
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mt: BCDesignTokens.layoutMarginMedium,
                  mb: BCDesignTokens.layoutMarginSmall,
                }}
              >
                What Role would you like to assign this User?
              </Typography>
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
                  selectAll
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
