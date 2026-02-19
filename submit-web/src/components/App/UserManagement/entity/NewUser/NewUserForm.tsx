import { TableBox } from "@/components/Shared/Layouts/TableBox";
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import ControlledRadioGroup from "@/components/Shared/ControlledFormFields/ControlledRadioGroup";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Form from "@/components/Shared/Forms/common";
import { UserRoleOptions } from "./UserRoleOptions";
import { useNavigate } from "@tanstack/react-router";
import { useAccount } from "@/store/accountStore";
import ControlledMultiSelect, {
  OptionType,
} from "@/components/Shared/ControlledFormFields/ControlledMultiSelect";
import { When } from "react-if";
import { useMemo } from "react";
import {
  getAccountPackagesByAccountIdQueryOptions,
  useGetAccountProjectsByAccount,
} from "@/hooks/api/useProjects";
import { useCreateInvitationToExistingProject } from "@/hooks/api/useInvitations";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useModal } from "@/components/Shared/Modals/modalStore";
import UserManagementModal from "./UserManagementModal";
import { useQuery } from "@tanstack/react-query";
import NewUserFormSkeleton from "./NewUserFormSkeleton";
import { isAxiosError } from "axios";

const newUser = yup.object().shape({
  email: yup.string().email().required("Please enter a valid email address."),
  role_name: yup.string().required("Please select an option."),
  original_package_ids: yup
    .array()
    .of(yup.string()) // Ensures project IDs are strings
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
      then: (schema) => schema.min(1, "Please select at least one submission."),
      otherwise: (schema) => schema.notRequired(),
    }),
  project_ids: yup
    .array()
    .of(yup.string()) // Ensures project IDs are strings
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN,
      then: (schema) => schema.min(1, "Please select at least one project."),
      otherwise: (schema) => schema.notRequired(),
    }),
});

type NewUserSchema = yup.InferType<typeof newUser>;

export default function NewUserForm() {
  const { accountId, proponentId, userManagementRole } = useAccount();
  const navigate = useNavigate();
  const { setOpen: setOpenModal, setClose: closeModal } = useModal();

  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId,
  });

  const { mutate: createInvite, isPending: isPendingInvitation } =
    useCreateInvitationToExistingProject({
      onSuccess: () => {
        notify.success("User invited successfully");
        navigate({ to: "/proponent/user-management" });
      },
      onError: (error: any) => {
        // Check if the error contains existing user information
        const existing_user = error.response?.data?.existing_user;

        if (existing_user?.status === "ACTIVE") {
          setOpenModal(
            <UserManagementModal
              title="User Already Exists"
              description="This email address already has an active user in your EPIC.submit account."
              instructions={{
                title: "To edit a user's access permissions:",
                steps: [
                  "Navigate to the User Management table",
                  "Find the user by name",
                  "Click 'View/Edit User Access' to open their details page",
                  "Select 'Edit Access' to modify permissions or manage submission collaborators",
                ],
              }}
              onClose={() => closeModal()}
            />,
          );
        } else if (existing_user?.status === "PENDING") {
          setOpenModal(
            <UserManagementModal
              title="Pending Invitation"
              description="This email address already has a pending invitation to EPIC.submit."
              instructions={{
                title: "To resend the invitation:",
                steps: [
                  "Go to the User Management table",
                  "Locate the user by their name",
                  "Click the 'Resend Email Invite' button",
                  "Once sent, the user will receive a new invitation email with instructions to join EPIC.submit",
                ],
              }}
              onClose={() => closeModal()}
            />,
          );
        } else {
          const errorMessage = isAxiosError(error)
            ? error.response?.data?.message || "An unexpected error occurred"
            : "An unexpected error occurred";
          notify.error("Error adding user: " + errorMessage);
        }
      },
    });

  const { data: accountPackages, isPending: isPendingPackages } = useQuery(
    getAccountPackagesByAccountIdQueryOptions({
      accountId: accountId,
    }),
  );
  const methods = useForm<NewUserSchema>({
    resolver: yupResolver(newUser),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      role_name: "",
      original_package_ids: [],
      project_ids: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const selectedRole = watch("role_name");

  const handleCompleteForm = (formData: NewUserSchema) => {
    const { email, role_name, original_package_ids, project_ids } = formData;
    const account_project_id = userManagementRole?.account_project_id;

    if (!account_project_id) {
      notify.error("Error: you do not have access to any project.");
      return;
    }

    // if role is SPECIFIC_PROJECT_ADMIN, set role to PROJECT_ADMIN since its the same role in backend
    const selected_role_name =
      role_name === USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN
        ? USER_MANAGEMENT_ROLE.PROJECT_ADMIN
        : role_name;

    const request = {
      proponent_id: proponentId,
      account_id: accountId,
      role_name: selected_role_name,
      email,
      account_project_ids: [account_project_id],
      project_ids: project_ids?.map(Number) ?? undefined,
      original_package_ids: original_package_ids?.map(Number) ?? undefined,
    };
    createInvite(request);
  };

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
        value: String(accountProject.project_id),
        label: accountProject.project.name,
      })) || [],
    [accountProjects],
  );

  if (isPendingPackages) {
    return <NewUserFormSkeleton />;
  }

  return (
    <TableBox mainLabel={"User Management"}>
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(handleCompleteForm)} methods={methods}>
          <Box
            flexDirection={"column"}
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <Container
              maxWidth="sm"
              sx={{
                pt: BCDesignTokens.layoutPaddingMedium,
                pb: BCDesignTokens.layoutPaddingSmall,
                alignSelf: "flex-start",
                m: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: BCDesignTokens.themeBlue100,
                  fontWeight: 700,
                }}
              >
                Add New User
              </Typography>
              <Divider
                sx={{ backgroundColor: BCDesignTokens.themeGold100, height: 1 }}
              />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  mt: BCDesignTokens.layoutMarginLarge,
                }}
              >
                Enter the new user's email address.
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: BCDesignTokens.typographyColorPlaceholder }}
              >
                The user will receive an email invitation to join your project.
              </Typography>
              <ControlledTextField
                variant="outlined"
                fullWidth
                name="email"
                sx={{ mt: BCDesignTokens.layoutPaddingSmall }}
              />
            </Container>
            <Container
              maxWidth="sm"
              sx={{
                pb: BCDesignTokens.layoutPaddingSmall,
                alignSelf: "flex-start",
                m: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: BCDesignTokens.themeBlue100,
                  fontWeight: 700,
                }}
              >
                Assign Application Access
              </Typography>
              <Divider
                sx={{ backgroundColor: BCDesignTokens.themeGold100, height: 1 }}
              />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  mt: BCDesignTokens.layoutMarginLarge,
                  mb: BCDesignTokens.layoutMarginSmall,
                }}
              >
                What permissions should this user have?
              </Typography>
              <ControlledRadioGroup name="role_name">
                <UserRoleOptions
                  error={Boolean(errors["role_name"])}
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
              </ControlledRadioGroup>

              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: BCDesignTokens.layoutMarginXlarge }}
              >
                <LoadingButton type="submit" loading={isPendingInvitation}>
                  Add User
                </LoadingButton>
                <Button
                  variant="text"
                  onClick={() => navigate({ to: "/proponent/user-management" })}
                >
                  Cancel
                </Button>
              </Stack>
            </Container>
          </Box>
        </Form>
      </FormProvider>
    </TableBox>
  );
}
