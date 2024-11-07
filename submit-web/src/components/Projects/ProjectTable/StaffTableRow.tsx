import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionPackage } from "@/models/Package";
import { PackageStatusChipStack } from "../../PackageStatusChip/PackageStatusChipStack";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "./StyledComponents";
import EmptyRow from "./EmptyRow";
import { useNavigate } from "@tanstack/react-router";

interface ProjectRowProps {
  submissionPackage: SubmissionPackage;
}

export default function StaffTableRow({ submissionPackage }: ProjectRowProps) {
  const navigate = useNavigate();
  const onSubmissionClick = () => {
    navigate({
      to: `/proponent/projects/${submissionPackage.account_project_id}/submission-packages/${submissionPackage.id}`,
    });
  };
  return (
    <>
      <StyledProjectTableRow>
        <StyledProjectTableCell>
          <Link
            sx={{
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
            onClick={onSubmissionClick}
          >
            <Typography
              variant="h6"
              color={BCDesignTokens.themeBlue90}
              fontWeight={"500"}
              sx={{ mr: 0.5 }}
            >
              {submissionPackage.name}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.meta?.type || ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.days_since_submission || ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.meta?.cc_completed_on || ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.meta?.mp_review || ""}
        </StyledProjectTableCell>
        <TableCell align="center">
          <PackageStatusChipStack status={submissionPackage.status} />
        </TableCell>
      </StyledProjectTableRow>
      <EmptyRow />
    </>
  );
}
