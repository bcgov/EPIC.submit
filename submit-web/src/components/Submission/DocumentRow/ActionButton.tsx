import { IconButton, Menu, MenuItem } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import FileOrganizeModal from "./FileOrganizeModal";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useParams } from "@tanstack/react-router";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";

type ActionButtonProps = Readonly<{
  submission: Submission;
}>;
export const ActionButton = ({ submission }: ActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { setOpen: setModalOpen, setIsLoading, setClose } = useModal();

  const { submissionPackageId, projectId } = useParams({
    strict: false,
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMove = () => {
    setModalOpen(
      <FileOrganizeModal
        submission={submission}
        submissionPackageId={submissionPackageId}
        accountProjectId={projectId}
      />,
    );
    handleClose();
  };

  const handleDelete = () => {
    // Implement delete functionality here
    // This could involve calling an API to delete the submission
    // and then updating the UI accordingly.
    console.log("Delete action triggered for submission:", submission.id);
    handleClose();

    setModalOpen(
      <ConfirmationModal
        onConfirm={() => {
          setIsLoading(true);
          // Call the API to delete the submission here
          // mock API call
          setTimeout(() => {
            setIsLoading(false);
            setClose();
          }, 1000);
        }}
        onCancel={() => {
          setClose();
        }}
        title={"Document Deletion Warning"}
        description={"Warning: This action cannot be undone."}
        confirmText={"Delete Document"}
        secondaryActionText="Cancel"
      />,
    );
  };

  return (
    <>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? "long-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon htmlColor={BCDesignTokens.typographyColorLink} />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          "aria-labelledby": "long-button",
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleMove}>Move</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </>
  );
};
