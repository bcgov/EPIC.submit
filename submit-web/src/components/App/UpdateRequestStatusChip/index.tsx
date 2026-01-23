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
