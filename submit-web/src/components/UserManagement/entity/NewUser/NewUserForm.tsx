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
import { useGetAccountPackagesByAccountId } from "@/hooks/api/useProjects";
import { useCreateInvitation } from "@/hooks/api/useInvitations";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

const newUser = yup.object().shape({
  email: yup.string().email().required("Please enter a valid email address."),
  role_name: yup.string().required("Please select an option."),
  package_ids: yup
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
  const { mutate: createInvite, isPending: isPendingInvitation } =
    useCreateInvitation({
      onSuccess: () => {
        notify.success("User added successfully");
        navigate({ to: "/proponent/user-management" });
      },
      onError: () => {
        notify.error("Error adding user");
      },
    });
  const { data: accountPackages } = useGetAccountPackagesByAccountId({
    accountId: accountId,
  });

  const methods = useForm<NewUserSchema>({
    resolver: yupResolver(newUser),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      role_name: "",
      package_ids: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;
  const { watch } = methods;

  const selectedRole = watch("role_name"); // Watch the selected radio value

  const getProjectIds = () => {
    const packageIds = watch("package_ids") || [];
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
    const { email, role_name, package_ids } = formData;

    const request = {
      proponent_id: proponentId,
      account_id: accountId,
      role_name,
      email,
      project_ids: getProjectIds(),
      package_ids: package_ids ? package_ids.map(Number) : undefined,
    };

    createInvite(request);
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

  return (
    <TableBox mainLabel={"User Management"}>
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(handleCompleteForm)}>
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
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mt: BCDesignTokens.layoutMarginMedium,
                  mb: BCDesignTokens.layoutMarginSmall,
                }}
              >
                Enter the new user's email address associated with their BCeID
                account.
              </Typography>
              <Typography variant="subtitle2">
                The user will receive an email invitation to join your project.
              </Typography>
              <ControlledTextField
                variant="outlined"
                fullWidth
                name="email"
                sx={{ mt: BCDesignTokens.layoutPaddingMedium }}
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
                variant="body2"
                sx={{
                  fontWeight: 700,
                  mt: BCDesignTokens.layoutMarginMedium,
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
                  selectAll
                  name="package_ids"
                  options={options}
                />
              </When>

              <Stack direction="row" spacing={2}>
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
