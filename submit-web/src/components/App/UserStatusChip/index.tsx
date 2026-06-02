import { StatusChip, StatusChipTheme } from "@/components/Shared/StatusChip";

type StyleProps = {
  theme: StatusChipTheme;
  label: string;
};

export type UserPackageStatus = "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED" | "INACTIVE";

const statusStyles: Record<UserPackageStatus, StyleProps> = {
  ACTIVE: {
    theme: "success",
    label: "Active User",
  },
  PENDING: {
    theme: "purple",
    label: "Invited",
  },
  REVOKED: {
    theme: "danger",
    label: "Revoked",
  },
  REJECTED: {
    theme: "danger",
    label: "Rejected",
  },
  INACTIVE: {
    theme: "orange",
    label: "Deactivated",
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
    <StatusChip
      theme={style.theme}
      label={style.label}
    />
  );
}
