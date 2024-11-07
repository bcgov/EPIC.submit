import { ArrowForwardIos } from "@mui/icons-material";
import { Link, TableCell, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { SubmissionPackage } from "@/models/Package";
import dayjs from "dayjs";
import { PackageStatusChipStack } from "../../PackageStatusChip/PackageStatusChipStack";
import {
  StyledProjectTableCell,
  StyledProjectTableRow,
} from "./StyledComponents";
import EmptyRow from "./EmptyRow";
import { useNavigate } from "@tanstack/react-router";

interface ProjectRowProps {
  subPackage: SubmissionPackage;
}

export default function ProponentTableRow({ subPackage }: ProjectRowProps) {
  const navigate = useNavigate();
  const onSubmissionClick = () => {
    navigate({
      to: `/proponent/projects/${subPackage.account_project_id}/submission-packages/${subPackage.id}`,
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
              {subPackage.name}
            </Typography>
            <ArrowForwardIos fontSize="small" />
          </Link>
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {subPackage.submitted_on
            ? dayjs(subPackage.submitted_on).format("DD-MMM-YYYY")
            : "--"}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="right">
          {subPackage.submitted_by ?? "--"}
        </StyledProjectTableCell>
        <StyledProjectTableCell align="center">
          <PackageStatusChipStack status={subPackage.status} />
        </StyledProjectTableCell>
      </StyledProjectTableRow>
      <EmptyRow />
    </>
  );
}
