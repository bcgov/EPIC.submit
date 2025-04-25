import { Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};

export type UserPackageStatus = "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED";

const statusStyles: Record<UserPackageStatus, StyleProps> = {
  ACTIVE: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
      height: "24px",
    },
    label: "Active User",
  },
  PENDING: {
    sx: {
      borderRadius: 1,
      border: `1px solid #9B6BDA`,
      background: "#F6E4FF",
      height: "24px",
    },
    label: "Invited",
  },
  REVOKED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
    },
    label: "Revoked",
  },
  REJECTED: {
    sx: {
      borderRadius: 1,
      border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      background: BCDesignTokens.supportSurfaceColorDanger,
      height: "24px",
    },
    label: "Rejected",
  },
};

type UserStatusChipProps = Readonly<{
  status: UserPackageStatus;
}>;
export default function UserStatusChip({ status }: UserStatusChipProps) {
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
