import { LoadingButton } from "@/components/Shared/LoadingButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Invitation } from "@/models/Invitation";
import { AppConfig } from "@/utils/config";
import { TextField, Tooltip, Typography } from "@mui/material";
import { Project } from "@/models/Project";
import { useCreateInvitation } from "@/hooks/api/useInvitations";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { PlainTableCell } from "@/components/Shared/Table/common";
import { useMemo, useState } from "react";

type RegistrationUrlCellProps = {
  project: Project;
  pendingInvitation?: Invitation;
  usedProjectInvitations: Invitation[];
  addInvitation: (invitation: Invitation) => void;
};

export const RegistrationUrlCell = ({
  project,
  pendingInvitation,
  usedProjectInvitations,
  addInvitation,
}: RegistrationUrlCellProps) => {
  const [tooltipText, setTooltipText] = useState("Copy");

  const url = `${AppConfig.appUrl}/proponent/registration?token=${pendingInvitation?.token}`;

  const trimmedUrl = useMemo(() => {
    return `https://${url.replace("https://", "").replace("http://", "")}`;
  }, [url]);

  const { mutate: createInvitation, isPending: isCreatingInvitation } =
    useCreateInvitation({
      onSuccess: (data) => {
        addInvitation(data);
        notify.success("Invitation URL generated successfully");
      },
      onError: () => {
        notify.error("Error generating invitation URL");
      },
    });

  const handleGenerateUrlClick = () => {
    createInvitation({
      proponent_id: project.proponent_id,
      project_ids: [project.id],
      role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
    });
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(url);
    setTooltipText("Copied");
    setTimeout(() => setTooltipText("Copy"), 2000);
  };

  // If there is a used invitation there exists a project admin. Show nothing
  if (usedProjectInvitations.length > 0) {
    return (
      <PlainTableCell colSpan={2}>
        <Typography variant="body1">
          This project has already been registered.
        </Typography>
      </PlainTableCell>
    );
  }

  return (
    <>
      <PlainTableCell>
        <TextField
          value={pendingInvitation ? trimmedUrl : ""}
          sx={{ margin: 0 }}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </PlainTableCell>
      <PlainTableCell
        width={pendingInvitation ? "64px" : "136px"}
        align="right"
      >
        {pendingInvitation ? (
          <Tooltip title={tooltipText} arrow>
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleCopyClick}
            >
              <ContentCopyIcon />
            </LoadingButton>
          </Tooltip>
        ) : (
          <LoadingButton
            variant="contained"
            color="primary"
            loading={isCreatingInvitation}
            onClick={handleGenerateUrlClick}
            sx={{ whiteSpace: "nowrap" }}
          >
            Generate URL
          </LoadingButton>
        )}
      </PlainTableCell>
    </>
  );
};
