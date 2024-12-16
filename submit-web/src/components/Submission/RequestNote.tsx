import { Box, Button, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";
import { When } from "react-if";
import PackageStatusChip from "../PackageStatusChip";
import { PACKAGE_STATUS } from "@/models/Package";
export interface RequestNote {
  id: string;
  note: string;
  created_by: string;
  created_date: string;
  updated: boolean;
}

export default function RequestNote({ note }: { note: RequestNote }) {
  const createdDate = dayjs(note.created_date).format("DD-MMM-YYYY");

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
          {note.created_by}
        </Typography>
        <Typography variant="subtitle1">{createdDate}</Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "space-between",
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        <Typography key={note.id} variant="body1" sx={{ mb: 1 }}>
          {note.note}
        </Typography>
        <When condition={note.updated}>
          <PackageStatusChip status={PACKAGE_STATUS.UPDATED.value} />
        </When>
        <When condition={!note.updated}>
          <Button color="secondary">Accept Update</Button>
        </When>
      </Box>
    </Box>
  );
}
