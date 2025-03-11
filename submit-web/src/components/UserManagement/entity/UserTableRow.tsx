import { PlainTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { SubmitLink } from "../../Shared/SubmitLink";
import UserStatusChip from "../../UserStatusChip";
import { AccountUserWithRole } from "@/models/AccountUser";
import { roleDetails } from "@/models/Role";

export default function UserTableRow({ user }: { user: AccountUserWithRole }) {
  return (
    <TableRow>
      <PlainTableCell align="left" width={"35%"}>
        <SubmitLink>{user.work_email_address}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        <SubmitLink>{user.full_name}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        {user.roles[0] && roleDetails[user.roles[0]?.role_name]?.label}
      </PlainTableCell>
      <PlainTableCell align="left" width={"15%"}>
        <UserStatusChip status={user.status} />
      </PlainTableCell>
    </TableRow>
  );
}
