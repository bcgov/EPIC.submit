import { SubmitLink } from "@/components/Shared/Text/SubmitLink";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useState } from "react";
import { HistoryTable } from "./HistoryTable";

type SubmissionHistoryProps = {
  submissionPackageId: string;
};
export const SubmissionHistory = ({
  submissionPackageId,
}: SubmissionHistoryProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ width: "100%" }}
    >
      <AccordionSummary
        expandIcon={<SubmitLink fontSize={"14px"}>View</SubmitLink>}
        style={{
          height: "40px",
          minHeight: 0,
        }}
        sx={[
          {
            py: 0,
            borderRadius: "4px",
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            background: BCDesignTokens.themeGray10,
            ".MuiAccordionSummary-expandIconWrapper": {
              transform: "none",
            },
          },
          expanded && {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        ]}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: "bold",
          }}
        >
          Submission History
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={[
          {
            pb: 0,
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            borderTop: `none`,
            borderRadius: "4px",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },
        ]}
      >
        <HistoryTable packageId={submissionPackageId} />
      </AccordionDetails>
    </Accordion>
  );
};
