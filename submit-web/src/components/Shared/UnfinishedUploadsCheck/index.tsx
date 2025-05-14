import { useFileStore } from "@/store/fileStore";
import React from "react";
import { useModal } from "../Modals/modalStore";
import UpdateModal from "../Modals/UpdateModal";
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
