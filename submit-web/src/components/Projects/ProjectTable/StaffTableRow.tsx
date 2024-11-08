import { ArrowForwardIos } from "@mui/icons-material";
import { Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionPackage } from "@/models/Package";
import { PackageStatusChipStack } from "../../PackageStatusChip/PackageStatusChipStack";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "./StyledComponents";
import EmptyRow from "./EmptyRow";
import { useNavigate, useParams } from "@tanstack/react-router";
import dayjs from "dayjs";

interface ProjectRowProps {
  submissionPackage: SubmissionPackage;
}

export default function StaffTableRow({ submissionPackage }: ProjectRowProps) {
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const navigate = useNavigate();

  const onSubmissionClick = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackage.id}`,
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
          {submissionPackage.meta?.type ?? ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.submitted_on
            ? dayjs(submissionPackage.submitted_on).format("DD-MMM-YYYY")
            : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.days_since_submission ?? ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.meta?.cc_completed_on ?? ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submissionPackage.meta?.mp_review ?? ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="center">
          <PackageStatusChipStack status={submissionPackage.status} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow />
    </>
  );
}
