import React from "react";
import {
  Link as MuiLink,
  styled,
  TableCell,
  TableRow,
  TableRowProps,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import SubmissionStatusChip from "./SubmissionStatusChip";
import { SubmissionItemTableRow as SubmissionItemTableRowType } from "./types";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { useNavigate, useParams } from "@tanstack/react-router";
import DocumentRow from "./DocumentRow";
import { Case, Switch, Unless, When } from "react-if";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";

const StyledTableCell = styled(TableCell)<{ error?: boolean }>(({ error }) => ({
  borderTop: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  padding: `${BCDesignTokens.layoutPaddingXsmall} !important`,
  "&:first-of-type": {
    borderLeft: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

const StyledTableRow = styled(TableRow)<{ error?: boolean }>(({ error }) => ({
  backgroundColor: error
    ? BCDesignTokens.supportSurfaceColorDanger
    : BCDesignTokens.themeBlue10,
  "&:hover": {
    backgroundColor: BCDesignTokens.themeBlue40,
  },
}));

type StyledTableRowProps = TableRowProps & { error?: boolean };
const PackageTableRow = ({
  error,
  children,
  ...otherProps
}: StyledTableRowProps) => {
  // pass error to every child
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { error } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      : child
  );

  return (
    <StyledTableRow error={error} {...otherProps}>
      {childrenWithProps}
    </StyledTableRow>
  );
};

type SubmissionItemTableRowProps = {
  item: SubmissionItemTableRowType;
  error?: boolean;
};

export default function SubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const { userType } = useAccount();

  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ProponentSubmissionItemTableRow item={item} error={error} />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <StaffSubmissionItemTableRow item={item} error={error} />
      </Case>
    </Switch>
  );
}

function ProponentSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { name, id, submissions, has_document, status } = item;

  const actionLabel = has_document ? "Add/Edit Files" : "Fill/Edit Form";

  const onActionClick = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  return (
    <>
      <PackageTableRow key={`row-${item.name}`} error={error}>
        <StyledTableCell colSpan={2}>
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
        </StyledTableCell>
        <StyledTableCell align="right"></StyledTableCell>
        <StyledTableCell align="right"></StyledTableCell>
        <StyledTableCell align="right">
          <When condition={SUBMISSION_STATUS.NEW_SUBMISSION.value !== status}>
            <SubmissionStatusChip status={status} />
          </When>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Unless condition={status === SUBMISSION_STATUS.SUBMITTED.value}>
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
          </Unless>
        </StyledTableCell>
      </PackageTableRow>
      {submissions.map((submission) => (
        <DocumentRow
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

function StaffSubmissionItemTableRow({
  item,
  error = false,
}: SubmissionItemTableRowProps) {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId",
  });

  const { name, id, submissions, has_document, status } = item;

  const actionLabel = has_document ? "Review" : "View";

  const onActionClick = () => {
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/submissions/${id}`,
    });
  };

  return (
    <>
      <PackageTableRow key={`row-${item.name}`} error={error}>
        <StyledTableCell colSpan={2}>
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
        </StyledTableCell>
        <StyledTableCell align="right"></StyledTableCell>
        <StyledTableCell align="right"></StyledTableCell>
        <StyledTableCell align="center">
          <When condition={SUBMISSION_STATUS.NEW_SUBMISSION.value !== status}>
            <SubmissionStatusChip status={status} />
          </When>
        </StyledTableCell>
        <StyledTableCell align="center">
          <Unless condition={status === SUBMISSION_STATUS.SUBMITTED.value}>
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
          </Unless>
        </StyledTableCell>
      </PackageTableRow>
      {submissions.map((submission) => (
        <DocumentRow
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
