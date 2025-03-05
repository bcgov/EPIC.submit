import { PlainTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { SubmitLink } from "../../Shared/SubmitLink";
import UserStatusChip from "../../UserStatusChip";
import { AccountUser } from "@/models/AccountUser";

export default function UserTableRow({ user }: { user: AccountUser }) {
  return (
    <TableRow>
      <PlainTableCell align="left" width={"35%"}>
        <SubmitLink>{user.work_email_address}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        <SubmitLink>{user.full_name}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        {user.position}
      </PlainTableCell>
      <PlainTableCell align="left" width={"15%"}>
        <UserStatusChip status={"INVITED"} />
      </PlainTableCell>
    </TableRow>
  );
}
