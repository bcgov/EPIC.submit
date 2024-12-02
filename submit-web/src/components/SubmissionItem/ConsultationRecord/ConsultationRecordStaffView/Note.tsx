import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export interface Note {
  id: string;
  note: string;
  created_by: string;
  created_date: string;
}

export default function Note({ note }: { note: Note }) {
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
        <Typography variant="subtitle1">{note.created_date}</Typography>
      </Box>
      <Typography key={note.id} variant="body1" sx={{ mb: 1 }}>
        {note.note}
      </Typography>
    </Box>
  );
}
