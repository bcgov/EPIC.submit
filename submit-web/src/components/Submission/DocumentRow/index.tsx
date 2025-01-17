import { useEffect, useState } from "react";
import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import {
  SUBMISSION_ITEM_METHOD,
  SUBMISSION_ITEM_TYPE,
  SubmissionItem,
} from "@/models/SubmissionItem";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";
import { useParams } from "@tanstack/react-router";
import { PACKAGE_STATUS } from "@/models/Package";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { StatusCell } from "./StatusCell";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  submissionItem: SubmissionItem;
}>;

export default function DocumentRow({
  documentSubmission,
  submissionItem,
}: DocumentRowProps) {
  const { submissionPackageId } = useParams({ strict: false });
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const {
    setOpen: setOpenModal,
    setClose: setCloseModal,
    setIsLoading,
  } = useModal();

  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;
  const isConsultationRecord =
    name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD;

  const subItemName = submissionItem.type.name;

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
      downloadDocument();
      notify.success("Successfully started review");
    },
  });

  useEffect(() => {
    setIsLoading(updatingSubmission);
  }, [updatingSubmission, setIsLoading]);

  const openConfirmationModal = () => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          updateStateSubmissionPackage({
            packageId: Number(submissionPackageId),
            data: {
              status: isConsultationRecord
                ? PACKAGE_STATUS.UNDER_CONSULTATION_CHECK.value
                : PACKAGE_STATUS.UNDER_REVIEW.value,
            },
          });
        }}
        title={`Start ${subItemName} Review`}
        description={`Would you like to start the ${subItemName} review now? This will start the counter for the Review.`}
        confirmText={`Start ${subItemName} Review`}
        cancelText="Start Later"
      />,
    );
  };

  const downloadDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };

  const openDocument = () => {
    if (
      !submissionItem.review_start_date &&
      submissionItem.type.submission_method ===
        SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD
    ) {
      openConfirmationModal();
      return;
    }
    downloadDocument();
  };

  return (
    <TableRow>
      <SubmitTableCell>
        <Typography
          variant="body1"
          color="inherit"
          sx={{
            overflow: "clip",
            textOverflow: "ellipsis",
            cursor: "pointer",
            mx: 0.5,
          }}
        >
          <MuiLink onClick={openDocument}>{name}</MuiLink>
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
      <SubmitTableCell align="right">{version}</SubmitTableCell>
      <SubmitTableCell align="right">
        <StatusCell
          submissionItem={submissionItem}
          submittedDocument={documentSubmission}
        />
      </SubmitTableCell>
      <SubmitTableCell align="right" colSpan={1}></SubmitTableCell>
    </TableRow>
  );
}
