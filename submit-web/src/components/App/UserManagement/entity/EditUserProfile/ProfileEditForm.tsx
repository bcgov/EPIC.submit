import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { TableBox } from "@/components/Shared/TableBox";
import {
  Box,
  Button,
  Grid,
  CircularProgress,
  Paper,
  Typography,
  Link,
} from "@mui/material";
import { useSaveUserProfile } from "@/hooks/api/useAccountUsers";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { AccountUserWithRole } from "@/models/AccountUser";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "@/components/App/UserStatusChip";
import { validatePhoneNumber } from "@/components/App/SubmissionItem/ContactInformation/utils";

const updateUserProfileSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  position: yup.string().required("Please enter your position."),
  companyName: yup.string().required("Please enter your company name."),
  phone: yup
    .string()
    .required("Please enter a phone number in this format: (xxx) xxx-xxxx.")
    .test(
      "phone-complete",
      "Please enter a complete phone number in this format: (xxx) xxx-xxxx.",
      validatePhoneNumber,
    ),
  email: yup
    .string()
    .email("Invalid email")
    .required("Please enter your email."),
});

export type UpdateUserProfileFormSchema = yup.InferType<
  typeof updateUserProfileSchema
>;

interface ProfileEditFormProps {
  user: AccountUserWithRole;
  guid: string;
}

function ProfileEditForm({ user, guid }: ProfileEditFormProps) {
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const navigate = useNavigate();
  const handleCancel = () => {
    navigate({
      to: `/`,
    });
    reset();
  };

  const onCreateFailure = () => {
    notify.error("Failed to save user profile");
  };

  const onCreateSuccess = (updatedUser: AccountUserWithRole) => {
    notify.success("User profile saved successfully");
    setUserData(updatedUser);
  };

  const { mutate: callSaveUserProfile, isPending: isSavingUserProfilePending } =
    useSaveUserProfile({
      guid,
      options: {
        onSuccess: onCreateSuccess,
        onError: onCreateFailure,
      },
    });

  const methods = useForm({
    resolver: yupResolver(updateUserProfileSchema),
    mode: "onSubmit",
    defaultValues: {
      givenName: user?.first_name || "",
      surname: user?.last_name || "",
      position: user?.position || "",
      companyName: user?.company_name || "",
      phone: user?.work_contact_number || "",
      email: user?.work_email_address || "",
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset({
      givenName: user?.first_name || "",
      surname: user?.last_name || "",
      position: user?.position || "",
      companyName: user?.company_name || "",
      phone: user?.work_contact_number || "",
      email: user?.work_email_address || "",
    });
  }, [user, reset]);

  const onSubmitHandler = async (data: UpdateUserProfileFormSchema) => {
    if (!guid) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      position: data.position,
      company_name: data.companyName,
      work_contact_number: data.phone,
      work_email_address: data.email,
    };
    callSaveUserProfile(accountData, {
      onSuccess: () => {
        setUserData((prev) => ({
          ...prev,
          ...accountData,
          full_name: `${data.givenName} ${data.surname}`,
          role: user.role,
          status: user.status,
        }));
      },
    });
  };

  return (
    <TableBox mainLabel={"User Management"}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: "1448px",
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
            <Grid item md={10}>
              <Typography variant="h5">{userData.full_name}</Typography>
            </Grid>
            <Grid
              item
              md={2}
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
              <UserStatusChip status={userData.status} />
            </Grid>
          </Grid>
        </Box>
        <UserInfoBox userData={userData} showEdit={false} />
        <Box
          sx={{
            padding: "24px 16px 16px 16px",
            alignSelf: "stretch",
          }}
        >
          <Grid item md={6} sm={12} xs={12}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmitHandler)}>
                <ControlledTextField
                  name="givenName"
                  label="Given Name"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: "bold" },
                  }}
                  sx={{ marginBottom: "4px" }}
                />
                <ControlledTextField
                  name="surname"
                  label="Surname"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: "bold" },
                  }}
                  sx={{ marginBottom: "4px" }}
                />
                <ControlledTextField
                  name="position"
                  label="Position/Role"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: "bold" },
                  }}
                  sx={{ marginBottom: "4px" }}
                />
                <ControlledTextField
                  name="companyName"
                  label="Company Name"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: "bold" },
                  }}
                  sx={{ marginBottom: "4px" }}
                />
                <ControlledTextField
                  name="phone"
                  label="Work Phone Number"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: "bold" },
                  }}
                  sx={{ marginBottom: "4px" }}
                />
                <ControlledTextField
                  name="email"
                  label="Work Email Address"
                  fullWidth
                  disabled
                  InputLabelProps={{
                    sx: {
                      fontWeight: "bold",
                      color: "black !important",
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000",
                      opacity: 1,
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ccc !important",
                    },
                    "& .MuiFormControl-root": {
                      margin: 0,
                    },
                    "& .MuiFormHelperText-root": {
                      display: "none",
                    },
                    margin: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "gray",
                    marginBottom: "40px",
                    whiteSpace: "nowrap",
                  }}
                >
                  * To change your email address, please contact{" "}
                  <Link href="mailto:EAO.EPICsystem@gov.bc.ca">
                    EAO.EPICsystem@gov.bc.ca
                  </Link>
                </Typography>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSavingUserProfilePending}
                >
                  {isSavingUserProfilePending ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="submit"
                  variant="text"
                  disabled={isSavingUserProfilePending}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </form>
            </FormProvider>
          </Grid>
        </Box>
      </Paper>
    </TableBox>
  );
}

export default ProfileEditForm;
