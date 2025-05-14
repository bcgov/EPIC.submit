import { useFileStore } from "@/store/fileStore";
import React from "react";
import { useModal } from "./Shared/Modals/modalStore";
import UpdateModal from "./Shared/Modals/UpdateModal";

type UnfinishedUploadsCheck = {
  children: React.ReactNode;
};
export const UnfinishedUploadsCheck = ({
  children,
}: UnfinishedUploadsCheck) => {
  const { pendingFiles } = useFileStore();
  const { setOpen: setOpenModal } = useModal();

  const handleClick = (onClick: () => void) => () => {
    if (!onClick) return;
    if (pendingFiles.length > 0) {
      setOpenModal(
        <UpdateModal
          title="About to lose your changes"
          description="You have unfinished uploads. If you leave this page, you will lose your uploads. Are you sure you want to leave this page?"
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
