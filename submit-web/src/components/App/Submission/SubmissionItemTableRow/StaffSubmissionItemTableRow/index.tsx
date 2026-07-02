import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionStatusChipStack } from "@/components/App/SubmissionStatusChip";
import RefreshIcon from "@mui/icons-material/Refresh";
import { When } from "react-if";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionItemMethod } from "@/models/SubmissionItem";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SUBMISSION_TYPE, SUBMISSION_STATUS } from "@/models/Submission";
import EmptyRow from "@/components/App/Projects/ProjectTable/EmptyRow";
import { SubmissionItemTableRowProps } from "..";
import SubmissionItemReviewConfirmation from "@/components/App/Submission/SubmissionItemReviewConfirmation";
import DocumentRow from "@/components/App/Submission/DocumentRow";
import { useMemo } from "react";
import { getSubmissionItemLabel } from "@/utils";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
  onRequestUpdate,
  hasPendingRequest,
  packageType,
}: SubmissionItemTableRowProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });

  const navigate = useNavigate();

  const { data: submissionPackage, isPending: isPackagePending } =
    useSuspenseQuery(
      getStaffSubmissionPackageQueryOptions({
        packageId: Number(submissionPackageId),
      }),
    );

  const { submissions, id } = item;

  const { submitted_on } = submissionPackage;
  const name = useMemo(() => {
    return getSubmissionItemLabel(item.type.name);
  }, [item.type.name]);

  const hasDocument =
    item.type.submission_method === SubmissionItemMethod.DOCUMENT_UPLOAD;
  const actionLabel = hasDocument ? "Review" : "View";

  const hasAccountProjectWork = Boolean(
    submissionPackage.account_project_work?.id,
  );

  const isUpdated = useMemo(() => {
    // Check if any submission has is_updated flag AND status is SUBMITTED
    // This ensures the proponent has actually resubmitted the item
    return Boolean(
      item.submissions?.find(
        (submission) =>
          submission.is_updated &&
          submission.status === SUBMISSION_STATUS.SUBMITTED
      )
    );
  }, [item.submissions]);

  const isPackageInEndStatus = useMemo(() => {
    // Check if package is in one of the end statuses where updates cannot be requested
    const endStatuses: string[] = ['APPROVED', 'ACCEPTED', 'REJECTED', 'NOT_APPROVED'];
    return endStatuses.some(status => submissionPackage.status?.includes(status as any));
  }, [submissionPackage.status]);

  const handleClick = () => {
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  if (isPackagePending) {
    return null;
  }

  return (
    <>
      <SubmitTablePrimaryRow key={`row-${name}`} error={error}>
        <SubmitPrimaryRowTableCell width={"50%"}>
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
              fontWeight={700}
              sx={{ mx: 0.5, fontSize: "1rem", lineHeight: "1.688rem" }}
            >
              {name}
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="left" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"10%"} />
        <SubmitPrimaryRowTableCell align="center" width={"20%"}>
          <Box mr={2} display={"flex"} justifyContent={"flex-end"}>
            <SubmissionStatusChipStack
              status={item.status}
              isFlaggedForUpdate={hasPendingRequest}
              isUpdated={isUpdated}
              showOnlyUpdateChips={hasAccountProjectWork}
            />
          </Box>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell
          align="left"
          width={hasAccountProjectWork ? "30%" : "10%"}
        >
          <Box
            display="flex"
            flexDirection="column"
            gap={0.5}
            alignItems={"flex-end"}
          >
            <When condition={submitted_on && !hasAccountProjectWork}>
              <SubmissionItemReviewConfirmation
                submissionItem={item}
                onClick={handleClick}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: BCDesignTokens.typographyColorLink,
                    "&:hover": {
                      cursor: "pointer",
                      textDecoration: "underline",
                    },
                  }}
                >
                  {actionLabel}
                </Typography>
              </SubmissionItemReviewConfirmation>
            </When>
            <When
              condition={Boolean(
                hasDocument && submitted_on && onRequestUpdate && !isPackageInEndStatus,
              )}
            >
              <MuiLink
                component="button"
                onClick={() => onRequestUpdate?.(item.type_id, item.type.name)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: BCDesignTokens.typographyColorLink,
                  fontSize: "14px",
                  textDecoration: "none",
                  textAlign: "left",
                  "&:hover": {
                    textDecoration: "underline",
                    cursor: "pointer",
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: "16px",
                    color: BCDesignTokens.typographyColorLink,
                  }}
                />
                Request Update
              </MuiLink>
            </When>
          </Box>
        </SubmitPrimaryRowTableCell>
      </SubmitTablePrimaryRow>
      <When condition={submitted_on}>
        {submissions
          ?.filter((submission) =>
            submission.type === SUBMISSION_TYPE.DOCUMENT &&
            submission.status !== SUBMISSION_STATUS.PENDING
          )
          .map((submission) => (
            <DocumentRow
              submissionItem={item}
              key={`doc-row-${submission.id}`}
              documentSubmission={submission}
              staff
              submissionPackage={submissionPackage}
              packageType={packageType}
            />
          ))}
      </When>
      <When condition={error}>
        <TableRow key={`row-${name}-divider`}>
          <TableCell
            width={"100%"}
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
              Please complete the {name} section.
            </Typography>
          </TableCell>
        </TableRow>
      </When>
      <EmptyRow colSpan={5} />
    </>
  );
}
