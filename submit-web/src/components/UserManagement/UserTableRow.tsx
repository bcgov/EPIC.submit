import { PlainTableCell } from "@/components/Shared/Table/common";
import { User } from "@/models/User";
import { TableRow } from "@mui/material";
import { SubmitLink } from "../Shared/SubmitLink";
import UserStatusChip from "../UserStatusChip";

export default function UserTableRow({ user }: { user: User }) {
  return (
    <TableRow>
      <PlainTableCell align="left" width={"35%"}>
        <SubmitLink>{user.account_user.work_email_address}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        <SubmitLink>{user.account_user.full_name}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        {user.account_user.position}
      </PlainTableCell>
      <PlainTableCell align="left" width={"15%"}>
        <UserStatusChip status={"INVITED"} />
      </PlainTableCell>
    </TableRow>
  );
}
