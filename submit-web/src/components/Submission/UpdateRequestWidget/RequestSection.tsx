import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";
import { UpdateRequest } from "@/models/UpdateRequest";
import { SubmissionItem } from "@/models/SubmissionItem";

type UpdateRequestProps = Readonly<{
  updateRequest: UpdateRequest;
  submissionItems: SubmissionItem[];
}>;

export default function RequestSection({
  updateRequest,
  submissionItems,
}: UpdateRequestProps) {
  const { reason, created_date, created_by } = updateRequest;
  const createdDate = dayjs(created_date).format("DD-MMM-YYYY");

  return (
    <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "space-between",
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {created_by}
        </Typography>
        <Typography variant="subtitle1">{createdDate}</Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
        Update requested for
      </Typography>

      <Typography variant="subtitle1">
        <ul>
          {submissionItems.map((item) => (
            <li key={item.id}>{item.type.name}</li>
          ))}
        </ul>
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        {reason}
      </Typography>
    </Box>
  );
}
