import { Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};

const statusStyles: Record<string, StyleProps> = {
  ACCEPTED: {
    label: "Accepted",
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
      width: "83px",
    },
  },
  UPDATE_REQUESTED: {
    label: "Update Requested",
    sx: {
      borderRadius: 1,
      border: "1px solid #f18a15",
      background: "#ffdeb8",
      height: "24px",
      minWidth: "130px",
    },
  },
  UPDATED: {
    label: "Updated",
    sx: {
      borderRadius: 1,
      border: "1px solid #9b6bda",
      background: "#f6e4ff",
      height: "24px",
      width: "83px",
    },
  },
};

type UpdateRequestStatusChipProps = Readonly<{
  status?: string;
}>;
export function UpdateRequestStatusChip({
  status = "",
}: UpdateRequestStatusChipProps) {
  const style = statusStyles[status];

  if (!style) {
    return null;
  }

  return (
    <Chip
      sx={{
        ...style.sx,
      }}
      label={style.label}
    />
  );
}
