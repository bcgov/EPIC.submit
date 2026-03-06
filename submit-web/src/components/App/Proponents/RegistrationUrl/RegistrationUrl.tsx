import { LoadingButton } from "@/components/Shared/LoadingButton";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  useCreateNewAccountProjectInvitation,
  useRenewInvitation,
} from "@/hooks/api/useInvitations";
import { InvitationStatus } from "@/models/Invitation";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useProponentStore } from "@/store/proponentStore";
import { AppConfig } from "@/utils/config";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";

type RegistrationUrlProps = {
  onInvitationCreated: () => void;
};

export const RegistrationUrl = ({
  onInvitationCreated,
}: RegistrationUrlProps) => {
  const [tooltipText, setTooltipText] = useState("Copy");

  const pendingInvitation = useProponentStore(
    (state) => state.pendingInvitation,
  );
  const selectedProjectsIds = useProponentStore(
    (state) => state.selectedProjectsIds,
  );

  const { proponentId } = useParams({
    from: "/staff/_staffLayout/proponents/$proponentId",
  });
  const { setOpen: setOpenModal, setClose: setCloseModal } = useModal();

  const url = `${AppConfig.appUrl}/proponent/account-registration?token=${pendingInvitation?.token}`;
  const helperText = pendingInvitation
    ? pendingInvitation.is_expired
      ? "This link has expired, you can renew the link by clicking the 'Renew Link' button"
      : pendingInvitation.expiry_date
        ? "This link will expire on " +
          new Date(pendingInvitation.expiry_date).toISOString().split("T")[0]
        : ""
    : "";

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

  const { mutate: renewInvitation, isPending: isRenewingInvitation } =
    useRenewInvitation({
      onSuccess: () => {
        onInvitationCreated();
        notify.success("Invitation URL renewed successfully");
      },
      onError: () => {
        notify.error("Error renewing invitation URL");
      },
    });

  const handleRenewUrlClick = () => {
    renewInvitation(pendingInvitation?.id || 0);
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
        mb: BCDesignTokens.layoutMarginXxlarge,
        mt: BCDesignTokens.layoutMarginXlarge,
      }}
    >
      <Grid item sm={12} md={5}>
        <TextField
          value={pendingInvitation ? url : ""}
          sx={{
            margin: 0,
          }}
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
            ),
          }}
          onFocus={(e) => e.target.blur()}
          helperText={helperText}
          FormHelperTextProps={{
            sx: {
              ml: "14px !important",
              color: pendingInvitation?.is_expired
                ? BCDesignTokens.typographyColorDanger + " !important"
                : "",
            },
          }}
          fullWidth
        />
      </Grid>
      <Grid item xs={2}>
        {pendingInvitation?.is_expired &&
        pendingInvitation.status === InvitationStatus.PENDING ? (
          <LoadingButton
            color="secondary"
            loading={isRenewingInvitation}
            onClick={handleRenewUrlClick}
          >
            Renew Link
          </LoadingButton>
        ) : (
          <LoadingButton
            color="primary"
            loading={isCreatingInvitation}
            onClick={handleGenerateUrlClick}
            disabled={!!pendingInvitation}
          >
            Generate Link
          </LoadingButton>
        )}
      </Grid>
    </Grid>
  );
};
