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
import { openModal } from "@/components/Shared/Modals/modalStore";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });
  const navigate = useNavigate();
  const {
    name,
    submissions,
    has_document,
    id,
    status,
    reviewStatus,
    review_start_date,
  } = item;
  const actionLabel = has_document ? "Review" : "View";

  const onActionClick = () => {
    if (!review_start_date) {
      //TODO: on confirm update status in next pr
      if (name === SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN) {
        openModal(
          <ConfirmationModal
            onConfirm={() => {}}
            title="Start Management Plan Review"
            description="Would you like to start the Management Plan Review now? This will start the counter for the MP Review."
            confirmText="Start MP Review"
            cancelText="Start Later"
          />
        );
      }
      if (name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD) {
        openModal(
          <ConfirmationModal
            onConfirm={() => {}}
            title="Start Consultation Check"
            description="Would you like to start the Consultation Check now?"
            confirmText="Start Consultation Check"
            cancelText="Start Later"
          />
        );
      }
    } else {
      navigate({
        to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
      });
    }
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
