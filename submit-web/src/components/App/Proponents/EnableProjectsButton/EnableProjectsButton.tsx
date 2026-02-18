import { LoadingButton } from "@/components/Shared/LoadingButton";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEnableProponentProject } from "@/hooks/api/useProponents";
import { useProponentStore } from "@/store/proponentStore";
import { List, ListItem, ListItemText, Typography } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";

type EnableProjectsButtonProps = {
  onEnableProjects: () => void;
};

export const EnableProjectsButton = ({
  onEnableProjects
}: EnableProjectsButtonProps) => {
  const { proponentId } = useParams({
    from: "/staff/_staffLayout/proponents/$proponentId",
  });
  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
  } = useModal();

  const proponent = useProponentStore((state) => state.proponent);
  const selectedProjectsIds = useProponentStore((state) => state.selectedProjectsIds);
  const eligibleProjects = useProponentStore((state) => state.eligibleProjects);

  const { mutate: enableProjects, isPending: isEnablingProjects } =
    useEnableProponentProject({
      onSuccess: () => {
        onEnableProjects();
        notify.success("Enabled project(s) successfully");
      },
      onError: () => {
        notify.error("Error enabling project(s)");
      },
    });

  const openConfirmationModal = () => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          enableProjects({
            proponentId: proponentId,
            projectIds: selectedProjectsIds,
          });
        }}
        title="Enable Project/Work in EPIC.submit"
        description={
          <>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              You will be enabling the following Project(s)/Work(s) in EPIC.submit:
            </Typography>
            <List>
              {eligibleProjects
                .filter(project => selectedProjectsIds.includes(project.id))
                .map(project => (
                  <ListItem
                    key={project.id}
                    sx={{ m: 0, py: 0 }}
                  >
                    <ListItemText
                      primary={"- " + project.name}
                      primaryTypographyProps={{
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                      }} 
                />
                  </ListItem>
                ))}
            </List>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              When you click the Confirm button below, the Account Administrator for {proponent?.name} will receive an email notification and assigned users will be able to submit documents in EPIC.submit.
            </Typography>
          </>
        }
      />,
    );
  };

  const openErrorModal = () => {
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
      
  const handleClick = () => {
    if (selectedProjectsIds.length === 0) {
      openErrorModal();
      return;
    }
    openConfirmationModal();
  };
  
  return (
    <LoadingButton
        variant="contained"
        color="primary"
        loading={isEnablingProjects}
        onClick={handleClick}
        sx={{ 
        whiteSpace: "nowrap",
        my: BCDesignTokens.layoutMarginXlarge
        }}
    >
        Enable in EPIC.submit
    </LoadingButton>
  );
};
