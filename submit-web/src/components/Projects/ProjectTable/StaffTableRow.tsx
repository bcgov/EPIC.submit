import { ArrowForwardIos } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { PACKAGE_STATUS, SubmissionPackage } from "@/models/Package";
import { PackageStatusChipStack } from "../../PackageStatusChip/PackageStatusChipStack";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "./StyledComponents";
import EmptyRow from "./EmptyRow";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { SubmitLink } from "@/components/Shared/SubmitLink";
import { useMemo } from "react";

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

  const {
    name,
    meta,
    days_since_submission = 0,
    status,
    submitted_on,
  } = submissionPackage;

  const { cc_completed_on, type, review_start_date } = meta || {};

  const mp_review = useMemo(() => {
    if (!review_start_date || !dayjs(review_start_date).isValid()) return "";

    const end_of_day_review_start_date = dayjs(review_start_date).endOf("day");
    dayjs(review_start_date).endOf("day");
    const days = dayjs().endOf("day").diff(end_of_day_review_start_date, "day");
    return Math.max(0, days);
  }, [review_start_date]);

  return (
    <>
      <StyledProjectTableRow>
        <StyledProjectTableCell
          sx={{
            minWidth: "150px",
            flexGrow: 1,
            py: 0,
          }}
          align="left"
        >
          <SubmitLink
            sx={{
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
            }}
            onClick={onSubmissionClick}
            disabled={!submitted_on}
          >
            <Stack direction="row" spacing={1} alignItems={"center"}>
              <Typography
                variant="h6"
                fontWeight={"500"}
                sx={{ mr: 0.5 }}
                color="inherit"
              >
                {name}
              </Typography>
              <ArrowForwardIos fontSize="small" htmlColor="inherit" />
            </Stack>
          </SubmitLink>
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
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
          align="left"
          sx={{
            lineHeight: 1.2,
            wordWrap: "break-word",
            color: BCDesignTokens.typographyFontSizeBody,
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
          {Boolean(days_since_submission) && `+ ${days_since_submission} Days`}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "75px",
          }}
        >
          {cc_completed_on ? dayjs(cc_completed_on).format("DD-MMM-YYYY") : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            maxWidth: "75px",
            color: BCDesignTokens.supportBorderColorSuccess,
          }}
        >
          {mp_review ? `+ ${mp_review} Days` : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <PackageStatusChipStack submissionPackage={submissionPackage} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow colSpan={7} />
    </>
  );
}
