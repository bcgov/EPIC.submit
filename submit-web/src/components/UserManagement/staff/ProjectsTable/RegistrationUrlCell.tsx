import { LoadingButton } from "@/components/Shared/LoadingButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Invitation } from "@/models/Invitation";
import { Route as CreateAccountRoute } from "@/routes/proponent/registration/create-account";
import { AppConfig } from "@/utils/config";
import { Link as MuiLink, Stack, TextField } from "@mui/material";
import { Project } from "@/models/Project";
import { useCreateInvitation } from "@/hooks/api/useInvitations";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

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
  const { mutate: createInvitation, isPending: isCreatingInvitation } =
    useCreateInvitation({
      onSuccess: (data) => {
        addInvitation(data);
      },
      onError: () => {
        notify.error("Error generating invitation URL");
      },
    });

  const onGenerateUrlClick = () => {
    createInvitation({
      proponent_id: project.proponent_id,
      project_ids: [project.id],
      role_id: 1,
    });
  };

  if (accountProjectId) {
    return null;
  }

  if (!pendingInvitation) {
    return (
      <Stack direction="row" spacing={2} alignItems={"center"}>
        <TextField
          value={""}
          variant="standard"
          sx={{ width: "100%", margin: 0 }}
          InputProps={{
            readOnly: true,
          }}
        />

        <LoadingButton
          variant="contained"
          color="primary"
          loading={isCreatingInvitation}
          onClick={onGenerateUrlClick}
          sx={{ whiteSpace: "nowrap" }}
        >
          Generate URL
        </LoadingButton>
      </Stack>
    );
  }

  return (
    <>
      <MuiLink
        sx={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          "&:hover": {
            textDecoration: "underline",
            cursor: "pointer",
          },
        }}
      >
        {url}
      </MuiLink>
      <LoadingButton
        variant="contained"
        color="primary"
        loading={false}
        onClick={() => {
          navigator.clipboard.writeText(url);
        }}
      >
        <ContentCopyIcon />
      </LoadingButton>
    </>
  );
};
