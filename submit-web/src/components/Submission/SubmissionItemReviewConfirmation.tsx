import React, { useEffect } from "react";
import {
  SUBMISSION_ITEM_MODAL_CONTENT,
  SUBMISSION_ITEM_TYPE,
  SubmissionItemTypeName,
} from "@/models/SubmissionItem";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { PACKAGE_STATUS } from "@/models/Package";

const acceptedSubmissionItemTypes = [
  SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD,
  SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
];

const ItemTypePackageStatusMap = {
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]:
    PACKAGE_STATUS.UNDER_CONSULTATION_CHECK.value,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: PACKAGE_STATUS.UNDER_REVIEW.value,
};

type SubmissionItemReviewConfirmationProps = Readonly<{
  packageId: number;
  itemType: SubmissionItemTypeName;
  onClick: () => void;
  children: React.ReactElement;
  bypass?: boolean;
}>;

export default function SubmissionItemReviewConfirmation({
  children,
  onClick,
  itemType,
  packageId,
  bypass = false,
}: SubmissionItemReviewConfirmationProps) {
  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
    setIsLoading,
  } = useModal();

  const {
    mutate: updateStateSubmissionPackage,
    isPending: updatingSubmission,
  } = useUpdateStateSubmissionPackage({
    onError: () => {
      setCloseModal();
      notify.error("Failed to start review");
    },
    onSuccess: () => {
      setCloseModal();
      onClick();
      notify.success("Successfully started review");
    },
  });

  useEffect(() => {
    setIsLoading(updatingSubmission);
  }, [updatingSubmission, setIsLoading]);

  const openConfirmationModal = () => {
    const { title, description, confirmText } = SUBMISSION_ITEM_MODAL_CONTENT[
      itemType
    ] || {
      title: `Start ${itemType} Review`,
      description: `Would you like to start the ${itemType} review now? This will begin the review counter.`,
      confirmText: `Start ${itemType} Review`,
    };

    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          updateStateSubmissionPackage({
            packageId: packageId,
            data: {
              status: ItemTypePackageStatusMap[itemType],
            },
          });
        }}
        title={title}
        description={description}
        confirmText={confirmText}
        cancelText="Start Later"
      />,
    );
  };

  const handleBypassClick = () => {
    onClick();
  };

  const handleConfirmationClick = () => {
    if (
      !acceptedSubmissionItemTypes.includes(itemType) ||
      !ItemTypePackageStatusMap[itemType]
    ) {
      notify.error(`Cannot start review on this item type: ${itemType}`);
      return;
    }
    openConfirmationModal();
  };

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement, {
        onClick: bypass ? handleBypassClick : handleConfirmationClick,
      });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
}
