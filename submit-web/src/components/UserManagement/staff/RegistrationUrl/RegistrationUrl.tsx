import { LoadingButton } from "@/components/Shared/LoadingButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import { Invitation } from "@/models/Invitation";
// import { AppConfig } from "@/utils/config";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
// import { Project } from "@/models/Project";
import { useCreateNewAccountProjectInvitation } from "@/hooks/api/useInvitations";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useModal } from "@/components/Shared/Modals/modalStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
// import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useState } from "react";

// type RegistrationUrlProps = {
// };

export const RegistrationUrl = () => {
  const [tooltipText] = useState("Copy");
  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
    setIsLoading,
  } = useModal();

  const { mutate: createInvitation, isPending: isCreatingInvitation } =
    useCreateNewAccountProjectInvitation({
      onSuccess: (data) => {
        // addInvitation(data);
        notify.success("Invitation URL generated successfully");
      },
      onError: () => {
        notify.error("Error generating invitation URL");
      },
    });

  const openConfirmationModal = () => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          setCloseModal();
        }}
        title="Select Project(s)/Works(s)"
        description="Please select the Project(s)/Work(s) you want to enable in EPIC.submit."
        confirmText="Close"
        hideSecondary
      />,
    );
  };
      
  const handleGenerateUrlClick = () => {
    // TODO
    openConfirmationModal();
  };

  const handleCopyClick = () => {
    // TODO
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item sm={12} md={5}>
        <TextField
          value={""}
          sx={{ margin: 0 }}
          InputProps={{ 
            readOnly: true,
            endAdornment: (
              <Tooltip title={tooltipText} arrow>
                <IconButton
                  color="primary"
                  // TODO: disabled={}
                  onClick={handleCopyClick}
                  sx={{ p: 0, mr: -1 }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            )
          }}
          fullWidth
        />
      </Grid>
      <Grid item xs={2}>
        <LoadingButton
          variant="contained"
          color="primary"
          loading={isCreatingInvitation}
          onClick={handleGenerateUrlClick}
          sx={{ whiteSpace: "nowrap" }}
        >
          Generate URL
        </LoadingButton>
      </Grid>
    </Grid>
  );
};
