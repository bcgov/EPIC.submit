import { PlainTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { SubmitLink } from "../../Shared/SubmitLink";
import UserStatusChip from "../../UserStatusChip";
import { AccountUserWithRole } from "@/models/AccountUser";
import { roleDetails } from "@/models/Role";
import { useNavigate } from "@tanstack/react-router";

export default function UserTableRow({ user }: { user: AccountUserWithRole }) {
  const navigate = useNavigate();
  const onUserClick = () => {
    navigate({
      to: "/proponent/edit-role",
      search: { user: JSON.stringify(user) },
    });
  };

  return (
    <TableRow>
      <PlainTableCell align="left" width={"35%"}>
        <SubmitLink>{user.work_email_address}</SubmitLink>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        <SubmitLink onClick={onUserClick}>{user.full_name}</SubmitLink>
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
