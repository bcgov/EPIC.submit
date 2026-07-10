import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
  Tooltip,
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
import { usePackageRoles } from "@/hooks/usePackageRoles";
import { GIS_ITEM_TYPE_NAME } from "@/utils/constants";
import { useHasRole } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

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
    const hasUpdatedSubmission = Boolean(
      item.submissions?.find(
        (submission) =>
          submission.is_updated &&
          submission.status === SUBMISSION_STATUS.SUBMITTED
      )
    );

    if (!hasUpdatedSubmission) return false;

    // Check if there's a recently accepted update request for this item
    // We need to check all_update_requests but exclude CLOSED ones (which are old/historical)
    // An accepted request will have status="ACCEPTED" and active=false
    const relevantUpdateRequestsForItem = submissionPackage.all_update_requests?.filter(
      (req) =>
        req.submission_item_types.includes(item.type_id) &&
        req.status !== "CLOSED" // Exclude old closed requests
    ) || [];

    // Check if there's at least one accepted request among the relevant ones
    const hasAcceptedRequest = relevantUpdateRequestsForItem.every(
      (req) => req.status === "ACCEPTED"
    );
    // Show "Updated" badge only if there's an updated submission AND no accepted request
    return hasUpdatedSubmission && !hasAcceptedRequest;
  }, [item.submissions, item.type_id, submissionPackage.all_update_requests]);

  const isPackageInEndStatus = useMemo(() => {
    // Check if package is in one of the end statuses where updates cannot be requested
    const endStatuses: string[] = ['APPROVED', 'ACCEPTED', 'REJECTED', 'NOT_APPROVED'];
    return endStatuses.some(status => submissionPackage.status?.includes(status as any));
  }, [submissionPackage.status]);

  // Check if this submission item is GIS (Geospatial Information)
  const isGISItem = item.type.name === GIS_ITEM_TYPE_NAME;

  // Get the appropriate roles for this package type
  const packageRoles = usePackageRoles(submissionPackage, packageType);
  
  // Check if user has the appropriate create role for this package type (includes full_access check)
  const hasPackageCreateRole = useHasRole(packageRoles.create);
  
  // Check if user has GIS permissions (includes full_access check)
  const hasGISPermissions = useHasRole(EPIC_SUBMIT_ROLE.gis_extended_edit);

  // Determine if Request Update should be shown
  // For GIS items: show if user has GIS permissions
  // For non-GIS items: show if user has the appropriate package create role (mp_create, w_create, etc.)
  const shouldShowRequestUpdate = isGISItem ? hasGISPermissions : hasPackageCreateRole;
  
  // Determine if Request Update should be disabled (for GIS items without GIS permissions)
  const isRequestUpdateDisabled = isGISItem && !hasGISPermissions;

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
          <Box ml={1} display={"flex"} justifyContent={"flex-start"}>
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
                hasDocument && submitted_on && onRequestUpdate && !isPackageInEndStatus && shouldShowRequestUpdate,
              )}
            >
              {isRequestUpdateDisabled ? (
                <Tooltip title="Your current role does not allow you to perform this action">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: BCDesignTokens.typographyColorPlaceholder,
                      fontSize: "14px",
                      cursor: "not-allowed",
                    }}
                  >
                    <RefreshIcon
                      sx={{
                        fontSize: "16px",
                        color: BCDesignTokens.typographyColorPlaceholder,
                      }}
                    />
                    Request Update
                  </Box>
                </Tooltip>
              ) : (
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
              )}
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
