import { StatusChip } from "@/components/Shared/StatusChip";
import { Box, Tooltip } from "@mui/material";

export const SecurityRejectedBadge = () => (
  <Tooltip
    title="This file did not pass the required security check and cannot be opened or downloaded."
  >
    <Box sx={{ display: "inline-flex" }}>
      <StatusChip label="Rejected - Security Check" theme="danger" />
    </Box>
  </Tooltip>
);
