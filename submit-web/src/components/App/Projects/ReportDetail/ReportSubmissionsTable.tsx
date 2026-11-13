import { useRef, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import {
  SubmitTableCell,
  SubmitTableHead,
  SubmitTableHeadCell,
  SubmitTableRow,
} from "@/components/Shared/Table/common";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { StatusChip } from "@/components/Shared/StatusChip";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { useModal } from "@/components/Shared/Modals/modalStore";
import { ProjectReport, SubmissionPackage } from "@/models/Package";
import { Submission } from "@/models/Submission";
import { usePackageRoles } from "@/hooks/usePackageRoles";
import { useReportDocumentVerify } from "@/hooks/useReportDocumentVerify";
import { getSubmissionDate } from "@/utils/submissionDocuments";
import {
  getReportDocumentSubmissions,
  getDocumentStatusLabel,
  getDocumentStatusTheme,
  isComplianceSelfReport,
  isDocumentAcknowledgeable,
  isDocumentVerifiable,
  isEaoUploaded,
  isMainReportDocument,
} from "./reportSubmissions";
import { VerifyDocumentModal } from "./VerifyDocumentModal";
import { AcknowledgeDocumentModal } from "./AcknowledgeDocumentModal";
import { useReportDocumentAcknowledge } from "@/hooks/useReportDocumentAcknowledge";

// Which project card the page is rendered on. The EAO/staff page adds an
// Actions column with a per-document Verify action; the Regulated Party page is
// read-only.
export type ReportSubmissionsAudience = "staff" | "proponent";

type ReportSubmissionsTableProps = {
  reportPackage: SubmissionPackage;
  audience?: ReportSubmissionsAudience;
};

const EMPTY_MESSAGE = "No documents have been submitted yet.";

const DocumentNameCell = ({ submission }: { submission: Submission }) => {
  const [loading, setLoading] = useState(false);
  const name = submission.submitted_document?.name ?? "";
  const url = submission.submitted_document?.url ?? "";

  const onDownload = async () => {
    if (loading || !url) return;
    try {
      setLoading(true);
      await getObjectFromS3({ name, url });
    } catch {
      notify.error("Failed to download document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={name}>
      <Box
        sx={{
          maxWidth: "520px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <DocumentLink
          name={
            <Typography
              component="span"
              aria-label={name}
              sx={{
                textDecoration: "underline",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                maxWidth: "520px",
                verticalAlign: "bottom",
              }}
            >
              {name}
            </Typography>
          }
          loading={loading}
          onClick={onDownload}
        />
      </Box>
    </Tooltip>
  );
};

type StaffActionsCellProps = {
  submission: Submission;
  reportPackage: SubmissionPackage;
  report?: ProjectReport | null;
};

/**
 * Actions cell for the EAO/staff report page. Shows a one-step "Verify" button
 * for each Regulated-Party document that is not yet verified. Verifying opens a
 * confirmation modal (no undo); EAO-uploaded and already-verified documents
 * show no button. Focus returns to the Verify button when the modal closes.
 */
const StaffActionsCell = ({
  submission,
  reportPackage,
  report,
}: StaffActionsCellProps) => {
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const { setOpen } = useModal();
  const packageRoles = usePackageRoles(
    reportPackage,
    reportPackage.type,
    submission.submitted_document?.folder,
  );
  const { verify } = useReportDocumentVerify({ packageId: reportPackage.id });
  const { acknowledge } = useReportDocumentAcknowledge({
    packageId: reportPackage.id,
  });

  const fileName = submission.submitted_document?.name ?? "";
  const canVerify = isDocumentVerifiable(submission);
  const canAcknowledge = isDocumentAcknowledgeable(submission, report);

  // Verify (SUBMITTED) and Acknowledge (VERIFIED main report) are mutually
  // exclusive per row; neither shows for any other state.
  if (!canVerify && !canAcknowledge) {
    return null;
  }

  const showComplianceHint =
    isComplianceSelfReport(report) && isMainReportDocument(submission);

  const openVerifyModal = () => {
    setOpen(
      <VerifyDocumentModal
        fileName={fileName}
        showComplianceHint={showComplianceHint}
        onVerify={() => verify(submission.id)}
      />,
      // Return focus to the Verify button when the modal closes with no change.
      () => actionButtonRef.current?.focus(),
    );
  };

  const openAcknowledgeModal = () => {
    setOpen(
      <AcknowledgeDocumentModal
        fileName={fileName}
        phase={report?.phase ?? ""}
        onAcknowledge={() => acknowledge(submission.id)}
      />,
      // Return focus to the Acknowledge button when the modal closes with no change.
      () => actionButtonRef.current?.focus(),
    );
  };

  return (
    <PermissionsGate scopes={[packageRoles.edit]}>
      <Button
        ref={actionButtonRef}
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<CheckIcon fontSize="small" />}
        onClick={canAcknowledge ? openAcknowledgeModal : openVerifyModal}
      >
        {canAcknowledge ? "Acknowledge" : "Verify"}
      </Button>
    </PermissionsGate>
  );
};

/**
 * Submissions table for a report/notification phase page. Lists every document
 * submitted for this report in this phase, newest first; Document Name
 * downloads and Status is a badge. For the EAO/staff audience a right-aligned
 * Actions column adds a per-document Verify action. Renders a single empty-state
 * row when there are no submissions.
 */
export const ReportSubmissionsTable = ({
  reportPackage,
  audience = "proponent",
}: ReportSubmissionsTableProps) => {
  const submissions = getReportDocumentSubmissions(reportPackage);
  const isStaff = audience === "staff";
  const report = reportPackage.project_report;
  const columnCount = isStaff ? 5 : 4;

  return (
    <TableContainer component={Box} sx={{ width: "100%" }}>
      <Table sx={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
        <SubmitTableHead>
          <TableRow>
            <SubmitTableHeadCell>Document Name</SubmitTableHeadCell>
            <SubmitTableHeadCell>Submitted By</SubmitTableHeadCell>
            <SubmitTableHeadCell>Date Submitted</SubmitTableHeadCell>
            <SubmitTableHeadCell>Status</SubmitTableHeadCell>
            {isStaff && (
              <SubmitTableHeadCell align="right">Actions</SubmitTableHeadCell>
            )}
          </TableRow>
        </SubmitTableHead>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <SubmitTableCell
                colSpan={columnCount}
                sx={{
                  p: "0 !important",
                  background: "#F1F8FE",
                  border: "1px solid #D8EAFD",
                  borderRadius: "5px",
                  "&:first-of-type": {
                    borderLeft: "1px solid #D8EAFD",
                    borderTopLeftRadius: 5,
                    borderBottomLeftRadius: 5,
                  },
                  "&:last-of-type": {
                    borderRight: "1px solid #D8EAFD",
                    borderTopRightRadius: 5,
                    borderBottomRightRadius: 5,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    height: "40px",
                    pl: "16px",
                    alignItems: "center",
                    alignSelf: "stretch",
                  }}
                >
                  {EMPTY_MESSAGE}
                </Box>
              </SubmitTableCell>
            </TableRow>
          ) : (
            submissions.map((submission) => (
              <SubmitTableRow key={submission.id}>
                <SubmitTableCell width={isStaff ? "45%" : "55%"} sx={{ pl: "1rem !important" }}>
                  <DocumentNameCell submission={submission} />
                </SubmitTableCell>
                <SubmitTableCell width={isStaff ? "15%" : "20%"}>
                  {submission.submitted_by || "-"}
                </SubmitTableCell>
                <SubmitTableCell width="10%">
                  {getSubmissionDate(submission) || "-"}
                </SubmitTableCell>
                <SubmitTableCell width="15%">
                  {isStaff ? (
                    <SubmissionStatusChip
                      status={
                        isEaoUploaded(submission)
                          ? "UPLOADED_BY_EAO"
                          : submission.status
                      }
                      label={getDocumentStatusLabel(submission)}
                      showIcon
                    />
                  ) : (
                    <StatusChip
                      label={getDocumentStatusLabel(submission)}
                      theme={getDocumentStatusTheme(submission)}
                    />
                  )}
                </SubmitTableCell>
                {isStaff && (
                  <SubmitTableCell align="right" width="15%">
                    <StaffActionsCell
                      submission={submission}
                      reportPackage={reportPackage}
                      report={report}
                    />
                  </SubmitTableCell>
                )}
              </SubmitTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportSubmissionsTable;
