import { ArrowForwardIos } from "@mui/icons-material";
import dateutils from "@/utils/dateUtils";
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
import { useManagementPlanName } from "@/hooks/useManagementPlanName";

type ProjectRowProps = Readonly<{
  submissionPackage: SubmissionPackage;
}>;

export default function StaffTableRow({ submissionPackage }: ProjectRowProps) {
  const navigate = useNavigate();
  const accountProjectId = submissionPackage.account_project_id;

  const onSubmissionClick = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackage.id}`,
    });
  };

  const {
    meta,
    days_since_submission = 0,
    submitted_on,
    status,
    version,
  } = submissionPackage;

  const { cc_completed_on, review_start_date, main_condition } = meta || {};

  const mp_review = useMemo(() => {
    if (!review_start_date || !dayjs(review_start_date).isValid()) return "";

    const end_of_day_review_start_date = dayjs(review_start_date).endOf("day");
    dayjs(review_start_date).endOf("day");
    const days = dayjs().endOf("day").diff(end_of_day_review_start_date, "day");
    return Math.max(0, days);
  }, [review_start_date]);

  const managementPlanName = useManagementPlanName(submissionPackage);

  return (
    <>
      <StyledProjectTableRow>
        <StyledProjectTableCell
          sx={{
            minWidth: "150px",
            width: "40%",
          }}
          align="left"
        >
          <Stack direction="row" spacing={1} alignItems={"center"}>
            <SubmitLink
              sx={{
                display: "flex",
                alignItems: "center",
                color: BCDesignTokens.themeBlue90,
                textDecoration: "none",
                width: "fit-content",
              }}
              onClick={onSubmissionClick}
              disabled={
                version.version === 1 &&
                status.includes(PACKAGE_STATUS.CREATED.value)
              }
            >
              <Typography
                variant="h6"
                fontWeight={"500"}
                sx={{ mr: 0.5 }}
                color="inherit"
              >
                {managementPlanName}
              </Typography>

              <ArrowForwardIos fontSize="small" htmlColor="inherit" />
            </SubmitLink>
          </Stack>
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "8%",
          }}
        >
          {main_condition?.condition_attributes?.submitted_to_eao_for}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
          sx={{
            lineHeight: 1.2,
            wordWrap: "break-word",
            color: BCDesignTokens.typographyFontSizeBody,
            width: "9%",
          }}
        >
          {dateutils.formatDate(submitted_on)}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
          sx={{
            color:
              days_since_submission > 4
                ? BCDesignTokens.typographyColorDanger
                : BCDesignTokens.supportBorderColorSuccess,
            width: "9%",
          }}
        >
          {Boolean(days_since_submission) && `+ ${days_since_submission} Days`}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
          sx={{
            width: "10%",
          }}
        >
          {dateutils.formatDate(cc_completed_on)}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="left"
          sx={{
            width: "9%",
            color: BCDesignTokens.supportBorderColorSuccess,
          }}
        >
          {mp_review ? `+ ${mp_review} Days` : ""}
        </StyledProjectTableCell>
        <StyledProjectTableCell
          align="right"
          sx={{
            pr: BCDesignTokens.layoutPaddingSmall,
            width: "15%",
          }}
        >
          <PackageStatusChipStack submissionPackage={submissionPackage} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow colSpan={7} />
    </>
  );
}
