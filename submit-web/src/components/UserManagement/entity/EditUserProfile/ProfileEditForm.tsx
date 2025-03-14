import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { TableBox } from "../../../Shared/TableBox";
import {
  Box,
  Button,
  Grid,
  CircularProgress,
  FormHelperText,
  Paper,
  Typography,
} from "@mui/material";
import { useSaveUserProfile } from "@/hooks/api/useAccountUsers";
import { notify } from "../../../Shared/Snackbar/snackbarStore";
import { AccountUserWithRole } from "@/models/AccountUser";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { BCDesignTokens } from "epic.theme";
import UserInfoBox from "./UserInfoBox";
import UserStatusChip from "../../../../components/UserStatusChip";

const updateUserProfileSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  position: yup.string().required("Please enter your position."),
  phone: yup.string().required("Please enter your phone number."),
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
      to: `/proponent/profile`,
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
            <Grid item xs={10}>
              <Typography variant="h2" sx={{ fontWeight: 400 }}>
                {userData.full_name}
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
          <Grid item xs={4}>
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
                    marginBottom: "4px",
                  }}
                />
                <FormHelperText
                  sx={{
                    marginTop: "-20px",
                    fontSize: "12px",
                    color: "gray",
                    marginBottom: "40px",
                  }}
                >
                  * To change your email address, please contact "tbd"
                </FormHelperText>
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
