import { LoadingButton } from "@/components/Shared/LoadingButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Invitation } from "@/models/Invitation";
import { Route as CreateAccountRoute } from "@/routes/proponent/registration/create-account";
import { AppConfig } from "@/utils/config";
import { TextField, Tooltip } from "@mui/material";
import { Project } from "@/models/Project";
import { useCreateInvitation } from "@/hooks/api/useInvitations";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { PlainTableCell } from "@/components/Shared/Table/common";
import { useState } from "react";

type RegistrationUrlCellProps = {
  project: Project;
  pendingInvitation?: Invitation;
  accountProjectId?: number;
  addInvitation: (invitation: Invitation) => void;
};

export const RegistrationUrlCell = ({
  project,
  pendingInvitation,
  accountProjectId,
  addInvitation,
}: RegistrationUrlCellProps) => {
  const url = `${AppConfig.appUrl}${CreateAccountRoute.fullPath}?=${pendingInvitation?.token}`;

  // trim the https or http part of the url
  const urlWithoutHttps = url.replace(/(^\w+:|^)\/\//, "");
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

  const [tooltipText, setTooltipText] = useState("Copy");

  const onGenerateUrlClick = () => {
    createInvitation({
      proponent_id: project.proponent_id,
      project_ids: [project.id],
      role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
    });
  };

  const onCopyClick = () => {
    navigator.clipboard.writeText(url);
    setTooltipText("Copied");
    setTimeout(() => setTooltipText("Copy"), 2000);
  };

  if (accountProjectId) {
    return <PlainTableCell colSpan={2} />;
  }

  if (!pendingInvitation) {
    return (
      <>
        <PlainTableCell>
          <TextField
            value={""}
            variant="standard"
            sx={{ margin: 0 }}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
          />
        </PlainTableCell>
        <PlainTableCell width={"136px"} align="right">
          <LoadingButton
            variant="contained"
            color="primary"
            loading={isCreatingInvitation}
            onClick={onGenerateUrlClick}
            sx={{ whiteSpace: "nowrap" }}
          >
            Generate URL
          </LoadingButton>
        </PlainTableCell>
      </>
    );
  }

  return (
    <>
      <PlainTableCell>
        <TextField
          value={urlWithoutHttps}
          variant="standard"
          sx={{ margin: 0 }}
          InputProps={{
            readOnly: true,
          }}
          fullWidth
        />
      </PlainTableCell>
      <PlainTableCell width={"64px"} align="right">
        <Tooltip title={tooltipText} arrow>
          <LoadingButton
            variant="contained"
            color="primary"
            loading={false}
            onClick={onCopyClick}
          >
            <ContentCopyIcon />
          </LoadingButton>
        </Tooltip>
      </PlainTableCell>
    </>
  );
};
