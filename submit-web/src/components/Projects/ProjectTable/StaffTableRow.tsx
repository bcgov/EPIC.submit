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
  const navigate = useNavigate();
  const accountProjectId =
    Number(accountProjectIdParam) || submissionPackage.account_project_id;

  const onSubmissionClick = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackage.id}`,
    });
  };

  const {
    name,
    meta: { cc_completed_on = "", mp_review = "", type = "" },
    days_since_submission = 0,
    status,
    submitted_on,
  } = submissionPackage;

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
              {name}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">{type}</StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {submitted_on ? dayjs(submitted_on).format("DD-MMM-YYYY") : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            color:
              days_since_submission > 4
                ? BCDesignTokens.typographyColorDanger
                : BCDesignTokens.supportBorderColorSuccess,
          }}
        >
          {days_since_submission && `+ ${days_since_submission} Days`}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {cc_completed_on}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {mp_review}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="center">
          <PackageStatusChipStack status={status} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow />
    </>
  );
}
