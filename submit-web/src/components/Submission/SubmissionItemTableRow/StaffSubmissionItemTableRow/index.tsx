import {
  Box,
  Link as MuiLink,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SUBMISSION_TYPE } from "@/models/Submission";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import { SubmissionItemTableRowProps } from "..";
import SubmissionItemReviewConfirmation from "../../SubmissionItemReviewConfirmation";
import DocumentRow from "../../DocumentRow";
import StaffStatusCell from "./StaffStatusCell";

export default function StaffSubmissionItemTableRow({
  item,
  error = false,
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

  const name = item.type.name;
  const hasDocument =
    item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD;

  const actionLabel = hasDocument ? "Review" : "View";

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
              fontWeight={900}
              sx={{ mx: 0.5 }}
            >
              {name}
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="left" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"10%"} />
        <SubmitPrimaryRowTableCell align="right" width={"20%"}>
          <Box mr={2}>
            <StaffStatusCell submissionItem={item} />
          </Box>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="left" width={"10%"}>
          <When condition={submitted_on}>
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
        </SubmitPrimaryRowTableCell>
      </SubmitTablePrimaryRow>
      <When condition={submitted_on}>
        {submissions
          .filter((submission) => submission.type === SUBMISSION_TYPE.DOCUMENT)
          .map((submission) => (
            <DocumentRow
              submissionItem={item}
              key={`doc-row-${submission.id}`}
              documentSubmission={submission}
              staff
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
