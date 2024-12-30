import {
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DocumentRow from "../DocumentRow";
import { When } from "react-if";
import { SubmissionItemTableCell, SubmissionItemTableRowProps } from ".";
import { PackageTableRow } from ".";
import { useNavigate, useParams } from "@tanstack/react-router";
import { SubmissionStatusChipStack } from "../../SubmissionStatusChip";
import { useModal } from "@/components/Shared/Modals/modalStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { useUpdateStateSubmissionPackage } from "@/hooks/api/usePackages";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PACKAGE_STATUS } from "@/models/Package";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });
  const { setOpen: setOpenModal, setClose: setCloseModal } = useModal();
  const navigate = useNavigate();
  const {
    name,
    submissions,
    has_document,
    id,
    status,
    reviewStatus,
    review_start_date,
    isUpdateRequest,
    isRevisionRequired,
  } = item;

  const actionLabel = has_document ? "Review" : "View";
  const isConsultationRecord =
    name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD;

  const { mutate: updateStateSubmissionPackage } =
    useUpdateStateSubmissionPackage({
      onError: () => {
        notify.error("Failed to update management plan");
      },
    });

  const onActionClick = () => {
    if (!review_start_date && has_document) {
      openVerificationModal();
      return;
    }
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  const openVerificationModal = () => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          setCloseModal();
          updateStateSubmissionPackage({
            packageId: Number(submissionPackageId),
            data: {
              status: isConsultationRecord
                ? PACKAGE_STATUS.UNDER_CONSULTATION_CHECK.value
                : PACKAGE_STATUS.UNDER_REVIEW.value,
            },
          });
          navigate({
            to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
          });
        }}
        title={`Start ${name} Review`}
        description={`Would you like to start the ${name} review now? This will start the counter for the Review.`}
        confirmText={`Start ${name} Review`}
        cancelText="Start Later"
      />
    );
  };

  return (
    <>
      <PackageTableRow
        key={`row-${item.name}`}
        error={error}
        onClick={onActionClick}
      >
        <SubmissionItemTableCell>
          <MuiLink
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              color="inherit"
              fontWeight={900}
              sx={{ mx: 0.5 }}
            >
              {name}
            </Typography>
          </MuiLink>
        </SubmissionItemTableCell>
        <SubmissionItemTableCell align="right" colSpan={2} />
        <SubmissionItemTableCell align="right">
          <SubmissionStatusChipStack
            status={status}
            reviewStatus={reviewStatus}
            isUpdateRequested={isUpdateRequest}
            isRevisionRequired={isRevisionRequired}
          />
        </SubmissionItemTableCell>

        <SubmissionItemTableCell align="center">
          <Typography
            variant="body2"
            sx={{
              color: BCDesignTokens.typographyColorLink,
              "&:hover": {
                cursor: "pointer",
                textDecoration: "underline",
              },
            }}
            onClick={onActionClick}
          >
            {actionLabel}
          </Typography>
        </SubmissionItemTableCell>
      </PackageTableRow>
      {submissions.map((submission) => (
        <DocumentRow
          submissionItem={item}
          key={`doc-row-${submission.id}`}
          documentSubmission={submission}
        />
      ))}
      <When condition={error}>
        <TableRow key={`row-${name}-divider`}>
          <TableCell
            colSpan={5}
            sx={{
              py: BCDesignTokens.layoutPaddingXsmall,
              px: 0,
              border: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: BCDesignTokens.typographyColorDanger,
              }}
            >
              Please complete the {item.name} section.
            </Typography>
          </TableCell>
        </TableRow>
      </When>
      <TableRow key={`row-${name}-divider`}>
        <TableCell
          colSpan={5}
          sx={{
            py: BCDesignTokens.layoutPaddingXsmall,
            border: 0,
          }}
        />
      </TableRow>
    </>
  );
}
