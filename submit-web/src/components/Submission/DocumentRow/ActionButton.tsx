import { IconButton, Menu, MenuItem } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Submission } from "@/models/Submission";
import { useEffect, useState } from "react";
import FileOrganizeModal from "./FileOrganizeModal";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { useParams } from "@tanstack/react-router";

type ActionButtonProps = Readonly<{
  submission: Submission;
}>;
export const ActionButton = ({ submission }: ActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { setOpen: setModalOpen } = useModal();

  const { submissionPackageId } = useParams({
    strict: false,
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (anchorEl && submission) {
      // If the anchor element is set and submission exists, open the modal
      setModalOpen(
        <FileOrganizeModal
          submission={submission}
          submissionPackageId={submissionPackageId}
        />,
      );
    }
  }, [anchorEl, submission]);

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
        <MenuItem onClick={handleClose}>Move</MenuItem>
        <MenuItem onClick={handleClose}>Delete</MenuItem>
      </Menu>
    </>
  );
};
