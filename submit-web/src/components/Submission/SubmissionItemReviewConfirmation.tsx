import React, { useEffect, useMemo } from "react";
import {
  SUBMISSION_ITEM_METHOD,
  SUBMISSION_ITEM_MODAL_CONTENT,
  SUBMISSION_ITEM_TYPE,
  SubmissionItem,
} from "@/models/SubmissionItem";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { PACKAGE_STATUS } from "@/models/Package";
import { SUBMISSION_ITEM_STATUS } from "@/models/Submission";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";

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
  submissionItem: SubmissionItem;
  onClick: () => void;
  children: React.ReactElement;
}>;

export default function SubmissionItemReviewConfirmation({
  submissionItem,
  children,
  onClick,
}: SubmissionItemReviewConfirmationProps) {
  const { userType } = useAccount();
  const { name: itemType, submission_method } = submissionItem.type;
  const hasDocument =
    submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD;
  const { package_id: packageId } = submissionItem;
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

  const bypass = useMemo(() => {
    if (userType !== USER_TYPE.STAFF) return true;
    if (!hasDocument) return true;
    if (submissionItem.status !== SUBMISSION_ITEM_STATUS.SUBMITTED.value)
      return true;
  }, [hasDocument, userType, submissionItem.status]);

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
