import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";
import { UpdateRequest } from "@/models/UpdateRequest";

type UpdateRequestProps = {
  updateRequest: UpdateRequest;
};

export default function RequestSection({ updateRequest }: UpdateRequestProps) {
  const { note, created_date, created_by } = updateRequest;
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "space-between",
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        <Typography variant="body1" sx={{ mb: 1 }}>
          {note}
        </Typography>
        {/* <When condition={note.updated}>
          <PackageStatusChip status={PACKAGE_STATUS.UPDATED.value} />
        </When> */}
        {/* <When condition={!note.updated}>
          <Button color="secondary">Accept Update</Button>
        </When> */}
      </Box>
    </Box>
  );
}
