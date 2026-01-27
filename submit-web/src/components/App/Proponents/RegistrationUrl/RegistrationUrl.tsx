import { LoadingButton } from "@/components/Shared/LoadingButton";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useCreateNewAccountProjectInvitation } from "@/hooks/api/useInvitations";
import { Invitation } from "@/models/Invitation";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { AppConfig } from "@/utils/config";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";

type RegistrationUrlProps = {
  pendingInvitation?: Invitation;
  selectedProjectsIds: (string | number)[];
  onInvitationCreated: () => void;
};

export const RegistrationUrl = ({
  pendingInvitation,
  selectedProjectsIds,
  onInvitationCreated
}: RegistrationUrlProps) => {
  const [tooltipText, setTooltipText] = useState("Copy");
  const { proponentId } = useParams({
    from: "/staff/_staffLayout/proponents/$proponentId",
  });
  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
  } = useModal();
  
  const url = `${AppConfig.appUrl}/proponent/account-registration?token=${pendingInvitation?.token}`;

  const { mutate: createInvitation, isPending: isCreatingInvitation } =
    useCreateNewAccountProjectInvitation({
      onSuccess: () => {
        onInvitationCreated();
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
    if (selectedProjectsIds.length === 0) {
      openConfirmationModal();
      return;
    }
    createInvitation({
      proponent_id: proponentId,
      project_ids: selectedProjectsIds,
      role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
    });
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(url);
    setTooltipText("Copied");
    setTimeout(() => setTooltipText("Copy"), 2000);
    notify.success("Link copied successfully");
  };
  
  return (
    <Grid
      container
      spacing={2}
      sx={{ 
        mb: BCDesignTokens.layoutMarginXxlarge 
      }}
    >
      <Grid item sm={12} md={5}>
        <TextField
          value={pendingInvitation ? url : ""}
          sx={{ margin: 0 }}
          InputProps={{ 
            readOnly: true,
            endAdornment: (
              <Tooltip title={tooltipText} arrow>
                <span>
                  <IconButton
                    color="primary"
                    disabled={!pendingInvitation}
                    onClick={handleCopyClick}
                    sx={{ p: 0, mr: -1 }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )
          }}
          onFocus={(e) => e.target.blur()}
          fullWidth
        />
      </Grid>
      <Grid item xs={2}>
        <LoadingButton
          variant="contained"
          color="primary"
          loading={isCreatingInvitation}
          onClick={handleGenerateUrlClick}
          disabled={!!pendingInvitation}
          sx={{ whiteSpace: "nowrap" }}
        >
          Generate URL
        </LoadingButton>
      </Grid>
    </Grid>
  );
};
