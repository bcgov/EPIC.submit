import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";
export interface Note {
  id: string;
  note: string;
  created_by: string;
  created_date: string;
}

export default function Note({ note }: { note: Note }) {
  const createdDate = dayjs(note.created_date).format("DD/MM/YYYY");

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
      <Typography key={note.id} variant="body1" sx={{ mb: 1 }}>
        {note.note}
      </Typography>
    </Box>
  );
}
