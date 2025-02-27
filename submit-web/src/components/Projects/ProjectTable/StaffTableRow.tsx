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
    name,
    meta,
    days_since_submission = 0,
    submitted_on,
    status,
    version,
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
            width: "40%",
          }}
          align="left"
        >
          <SubmitLink
            sx={{
              color: BCDesignTokens.themeBlue90,
              textDecoration: "none",
            }}
            onClick={onSubmissionClick}
            disabled={
              version.version === 1 &&
              status.includes(PACKAGE_STATUS.CREATED.value)
            }
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
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "8%",
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
            width: "12%",
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
            width: "5%",
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
            width: "10%",
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
