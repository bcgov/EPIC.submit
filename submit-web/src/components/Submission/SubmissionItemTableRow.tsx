import { Link, styled, TableCell, TableRow, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import SubmissionStatusChip from "./SubmissionStatusChip";
import { SubmissionItemTableRow as SubmissionItemTableRowType } from "./types";
import { SUBMISSION_STATUS } from "@/models/Submission";

type SubmissionItemTableRowProps = {
  item: SubmissionItemTableRowType;
};

const StyledTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: `1px solid ${BCDesignTokens.themeBlue20}`,
  py: BCDesignTokens.layoutPaddingXsmall,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  backgroundColor: BCDesignTokens.themeBlue10,
}));

export default function SubmissionItemTableRow({
  item,
}: SubmissionItemTableRowProps) {
  return (
    <>
      <StyledTableRow key={`row-${item.name}`}>
        <StyledTableCell colSpan={2}>
          <Link
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              color="inherit"
              fontWeight={900}
              sx={{ mr: 0.5 }}
            >
              {item.name}
            </Typography>
          </Link>
        </StyledTableCell>
        <StyledTableCell align="right"></StyledTableCell>
        <StyledTableCell align="right">{item.version ?? "--"}</StyledTableCell>
        <StyledTableCell
          align="right"
          sx={{ py: BCDesignTokens.layoutPaddingSmall }}
        >
          <SubmissionStatusChip
            status={SUBMISSION_STATUS.NEW_SUBMISSION.value}
          />
        </StyledTableCell>
        <StyledTableCell
          align="right"
          sx={{ py: BCDesignTokens.layoutPaddingSmall }}
        >
          <Link
            sx={{
              mx: BCDesignTokens.layoutPaddingXsmall,
              textDecoration: "none",
            }}
            component={"button"}
          >
            Edit
          </Link>
        </StyledTableCell>
      </StyledTableRow>
      <TableRow key={`row-${item.name}-divider`}>
        <TableCell
          colSpan={Object.keys(item).length + 1}
          sx={{
            py: BCDesignTokens.layoutPaddingXsmall,
            border: 0,
          }}
        />
      </TableRow>
    </>
  );
}
