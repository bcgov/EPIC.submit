import { TableBox } from "../../Shared/TableBox";
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
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import ControlledMultiSelect from "@/components/Shared/controlled/ControlledMultiSelect";
import { When } from "react-if";

const newUser = yup.object().shape({
  email: yup.string().email().required("Please enter a valid email address."),
  applicationAccess: yup.string().required("Please select an option."),
  project_ids: yup
    .array()
    .of(yup.string()) // Ensures project IDs are strings
    .when("applicationAccess", {
      is: (value: string) => value === "CollaboratorSpecific", // ✅ Ensure correct type comparison
      then: (schema) => schema.min(1, "Please select at least one project."),
      otherwise: (schema) => schema.notRequired(),
    }),
});

type NewUserSchema = yup.InferType<typeof newUser>;

export default function NewUserForm() {
  const { accountId } = useAccount();
  const navigate = useNavigate();

  const methods = useForm<NewUserSchema>({
    resolver: yupResolver(newUser),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      applicationAccess: "",
      project_ids: [],
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;
  const { watch } = methods;

  const selectedRole = watch("applicationAccess"); // Watch the selected radio value

  const handleCompleteForm = (formData: NewUserSchema) => {
    // eslint-disable-next-line no-console
    console.log(formData);
  };

  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId,
  });

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
              <ControlledRadioGroup name="applicationAccess">
                <FormOptions error={Boolean(errors["applicationAccess"])} />
              </ControlledRadioGroup>

              <When condition={selectedRole === "CollaboratorSpecific"}>
                <Typography sx={{ fontWeight: 700 }}>
                  Which Submission(s) would you like to assign that user to?
                </Typography>
                <ControlledMultiSelect
                  multiple
                  selectAll
                  name="project_ids"
                  options={
                    accountProjects?.map((accountProject) => ({
                      value: accountProject.project.id.toString(), // Store project ID in the form
                      label: accountProject.project.name, // Display project name
                    })) || []
                  }
                />
              </When>

              <Stack direction="row" spacing={2}>
                <Button type="submit">Add User</Button>
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
