import { PlainTableCell } from "@/components/Shared/Table/common";
import { TableRow, Typography, Box } from "@mui/material";
import { SubmitLink } from "../../Shared/SubmitLink";
import UserStatusChip from "../../UserStatusChip";
import { AccountUserWithRole } from "@/models/AccountUser";
import { roleDetails, USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "./userStore";
import { notify } from "../../Shared/Snackbar/snackbarStore";
import { InvitationStatus } from "@/models/Invitation";
import {
  useCreateInvitation,
  useRevokeInvitation,
} from "@/hooks/api/useInvitations";
import { useAccount } from "@/store/accountStore";
import { useGetAccountPackagesByAccountId } from "@/hooks/api/useProjects";

export default function UserTableRow({ user }: { user: AccountUserWithRole }) {
  const { setSelectedUser } = useUserStore();
  const navigate = useNavigate();
  const { proponentId, accountId } = useAccount();
  const { mutate: createInvitation } = useCreateInvitation({
    onSuccess: () => {
      notify.success("Invitation URL generated successfully");
    },
    onError: () => {
      notify.error("Error generating invitation URL");
    },
  });
  const { mutate: deleteInvitation } = useRevokeInvitation({
    onSuccess: () => {
      notify.success("Invitation revoked successfully");
    },
    onError: () => {
      notify.error("Error revoking invitation");
    },
  });
  const { data: accountPackages } = useGetAccountPackagesByAccountId({
    accountId: accountId,
  });

  const isPending = user.status === InvitationStatus.PENDING;
  const isRevoked = user.status === InvitationStatus.REVOKED;

  const onUserClick = () => {
    if (isPending) {
      revokeInvite();
      return;
    }
    setSelectedUser(user);
    navigate({
      to: "/proponent/user-management/user-details",
    });
  };

  const getProjectIds = () => {
    const packageIds = user.role.package_ids || [];
    const isSpecificSubmission =
      user.role.role_name ===
      USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR;
    return (
      accountPackages
        ?.filter(
          ({ packages }) =>
            !isSpecificSubmission ||
            packages.some(({ id }) => packageIds.includes(id.toString()))
        )
        .map(({ project_id }) => Number(project_id)) || []
    );
  };

  const resendInvite = () => {
    createInvitation({
      proponent_id: proponentId,
      project_ids: getProjectIds(),
      role_name: user.role.role_name,
      email: user.work_email_address,
      package_ids: user.role.package_ids,
    });
  };

  const revokeInvite = () => {
    deleteInvitation(user.token);
  };

  return (
    <TableRow>
      <PlainTableCell align="left" width={"25%"}>
        <Typography variant="body1">{user.work_email_address}</Typography>
      </PlainTableCell>
      <PlainTableCell align="left" width={"15%"}>
        <Typography variant="body1">{user.full_name}</Typography>
      </PlainTableCell>
      <PlainTableCell align="left" width={"20%"}>
        {user.role && roleDetails[user.role.role_name]?.label}
      </PlainTableCell>
      <PlainTableCell align="left" width={"10%"}>
        <UserStatusChip status={user.status} />
      </PlainTableCell>
      <PlainTableCell align="left" width={"30%"}>
        {!isRevoked && (
          <Box display={"flex"} gap={2} justifyContent={"space-between"} pr={2}>
            {isPending && (
              <SubmitLink onClick={resendInvite}>
                Resend Email Invite
              </SubmitLink>
            )}
            <SubmitLink onClick={onUserClick}>
              {isPending ? "Revoke User" : "View/Edit User Access"}
            </SubmitLink>
          </Box>
        )}
      </PlainTableCell>
    </TableRow>
  );
}
