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
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";

interface ProjectRowProps {
  submissionPackage: SubmissionPackage;
}

export default function StaffTableRow({ submissionPackage }: ProjectRowProps) {
  const navigate = useNavigate();
  const accountProjectId = submissionPackage.account_project_id;

  const onSubmissionClick = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackage.id}`,
    });
  };

  if (submissionPackage.json === null) {
    return <></>;
  }

  const {
    name,
    json,
    days_since_submission = 0,
    review_status,
    submitted_on,
    status,
  } = submissionPackage;

  const { cc_completed_on, mp_review, type } = json || {};

  return (
    <>
      <StyledProjectTableRow sx={{ maxHeight: "40px", py: 0 }}>
        <StyledProjectTableCell
          sx={{
            minWidth: "150px",
            flexGrow: 1,
            py: 0,
          }}
        >
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
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "75px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {type}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "80px",
            lineHeight: 1.2,
            wordWrap: "break-word",
            textAlign: "right",
            color:
              days_since_submission > 4
                ? BCDesignTokens.typographyColorDanger
                : BCDesignTokens.supportBorderColorSuccess,
          }}
        >
          {submitted_on ? dayjs(submitted_on).format("DD-MMM-YYYY") : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            color:
              days_since_submission > 4
                ? BCDesignTokens.typographyColorDanger
                : BCDesignTokens.supportBorderColorSuccess,
            maxWidth: "75px",
          }}
        >
          {days_since_submission && `+ ${days_since_submission} Days`}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          {cc_completed_on}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          {mp_review}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
            maxWidth: "100x",
          }}
        >
          <PackageStatusChipStack
            status={status}
            reviewStatus={review_status}
          />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow colSpan={7} />
    </>
  );
}
