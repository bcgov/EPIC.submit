import { TableBox } from "../../../Shared/TableBox";
import {
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Form from "@/components/Shared/Forms/common";
import { FormOptions } from "./FormOptions";
import { useNavigate } from "@tanstack/react-router";
import { useAccount } from "@/store/accountStore";
import ControlledMultiSelect, {
  OptionType,
} from "@/components/Shared/controlled/ControlledMultiSelect";
import { When } from "react-if";
import { useMemo } from "react";
import { getAccountPackagesByAccountIdQueryOptions } from "@/hooks/api/useProjects";
import { useCreateInvitation } from "@/hooks/api/useInvitations";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useModal } from "@/components/Shared/Modals/modalStore";
import UserManagementModal from "./UserManagementModal";
import { useQuery } from "@tanstack/react-query";
import NewUserFormSkeleton from "./NewUserFormSkeleton";

const newUser = yup.object().shape({
  email: yup.string().email().required("Please enter a valid email address."),
  role_name: yup.string().required("Please select an option."),
  original_package_ids: yup
    .array()
    .of(yup.string()) // Ensures project IDs are strings
    .when("role_name", {
      is: (value: string) =>
        value === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
      then: (schema) => schema.min(1, "Please select at least one project."),
      otherwise: (schema) => schema.notRequired(),
    }),
});

type NewUserSchema = yup.InferType<typeof newUser>;

export default function NewUserForm() {
  const { accountId, proponentId } = useAccount();
  const navigate = useNavigate();
  const { setOpen: setOpenModal, setClose: closeModal } = useModal();

  const { mutate: createInvite, isPending: isPendingInvitation } =
    useCreateInvitation({
      onSuccess: () => {
        notify.success("User added successfully");
        navigate({ to: "/proponent/user-management" });
      },
      onError: (error: any) => {
        // Check if the error contains existing user information
        const existing_user = error.response?.data?.existing_user;

        if (existing_user) {
          if (existing_user.status === "ACTIVE") {
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
          } else if (existing_user.status === "PENDING") {
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
          }
        } else {
          notify.error("Error adding user");
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
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const selectedRole = watch("role_name");

  const getProjectIds = () => {
    const packageIds = watch("original_package_ids") || [];
    const isSpecificSubmission =
      selectedRole === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR;
    return (
      accountPackages
        ?.filter(
          ({ packages }) =>
            !isSpecificSubmission ||
            packages.some(({ id }) => packageIds.includes(id.toString())),
        )
        .map(({ project_id }) => Number(project_id)) || []
    );
  };

  const handleCompleteForm = (formData: NewUserSchema) => {
    const { email, role_name, original_package_ids } = formData;
    const request = {
      proponent_id: proponentId,
      account_id: accountId,
      role_name,
      email,
      project_ids: getProjectIds(),
      original_package_ids: original_package_ids
        ? original_package_ids.map(Number)
        : undefined,
    };
    createInvite(request);
  };

  const options: OptionType[] = useMemo(
    () =>
      accountPackages?.flatMap((accountProject) =>
        Object.values(accountProject.packages).map((pkg) => ({
          value: String(pkg.original_package_id),
          label: pkg.name,
        })),
      ) || [],
    [accountPackages],
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
                  name="original_package_ids"
                  options={options}
                />
              </When>

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
