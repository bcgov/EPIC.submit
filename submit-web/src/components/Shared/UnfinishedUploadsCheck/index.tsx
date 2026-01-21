import { useFileStore } from "@/store/fileStore";
import React from "react";
import { useModal } from "@/components/Shared/Modals/modalStore";
import UpdateModal from "@/components/Shared/Modals/UpdateModal";
import { WarningAmber } from "@mui/icons-material";
import { Typography, Box } from "@mui/material";

type UnfinishedUploadsCheck = {
  children: React.ReactNode;
  customCondition?: boolean;
};
export const UnfinishedUploadsCheck = ({
  children,
  customCondition,
}: UnfinishedUploadsCheck) => {
  const { pendingFiles } = useFileStore();
  const { setOpen: setOpenModal } = useModal();

  const handleClick = (onClick: () => void) => () => {
    const isConditionMet = customCondition ?? pendingFiles.length > 0;
    if (!onClick) return;
    if (isConditionMet) {
      setOpenModal(
        <UpdateModal
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <WarningAmber color="warning" />
              <Typography variant="h6" component="span">
                Please wait!
              </Typography>
            </Box>
          }
          description="Please remain on this page until all the documents are uploaded."
        />,
      );
    } else {
      onClick();
    }
  };

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement, {
        onClick: handleClick(child.props.onClick),
      });
    }
    return child;
  });
  return <>{childrenWithProps}</>;
};
