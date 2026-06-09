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
  const selectedEntryIds = useProponentStore(
    (state) => state.selectedEntryIds,
  );
  const eligibleEntries = useProponentStore(
    (state) => state.eligibleEntries,
  );
  
  // Use eligibility entry IDs if available, otherwise fall back to legacy project IDs
  const useEntries = selectedEntryIds.length > 0;
  const selectedIds = useEntries ? selectedEntryIds : selectedProjectsIds;

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
    if (selectedIds.length === 0) {
      openConfirmationModal();
      return;
    }
    
    if (useEntries) {
      // New format: build eligible_entries from eligibility entries data
      const selectedEntries = eligibleEntries.filter(entry => selectedEntryIds.includes(entry.id));
      const eligibleEntriesMap = new Map<number, { work_ids: number[], non_work_item_types: string[] }>();
      
      selectedEntries.forEach(entry => {
        if (!eligibleEntriesMap.has(entry.project_id)) {
          eligibleEntriesMap.set(entry.project_id, { work_ids: [], non_work_item_types: [] });
        }
        
        const selection = eligibleEntriesMap.get(entry.project_id)!;
        
        if (entry.work_id) {
          selection.work_ids.push(entry.work_id);
        } else if (entry.non_work_item_type) {
          selection.non_work_item_types.push(entry.non_work_item_type);
        }
      });
      
      const eligible_entries = Array.from(eligibleEntriesMap.entries()).map(([project_id, selection]) => ({
        project_id,
        work_ids: selection.work_ids.length > 0 ? selection.work_ids : undefined,
        non_work_item_types: selection.non_work_item_types.length > 0 ? selection.non_work_item_types : undefined,
      }));
      
      createInvitation({
        proponent_id: proponentId,
        eligible_entries,
        role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
      });
    } else {
      // Legacy format: send project_ids
      createInvitation({
        proponent_id: proponentId,
        project_ids: selectedProjectsIds,
        role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
      });
    }
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
