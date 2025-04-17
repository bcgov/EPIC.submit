import { PlainTableCell } from "@/components/Shared/Table/common";
import { TableRow, Typography, Box, CircularProgress } from "@mui/material";
import { SubmitLink } from "../../Shared/SubmitLink";
import UserStatusChip from "../../UserStatusChip";
import { AccountUserWithRole } from "@/models/AccountUser";
import { roleDetails } from "@/models/Role";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "./userStore";
import { notify } from "../../Shared/Snackbar/snackbarStore";
import { InvitationStatus } from "@/models/Invitation";
import {
  useResendInvitation,
  useRevokeInvitation,
} from "@/hooks/api/useInvitations";
import { When } from "react-if";

export default function UserTableRow({ user }: { user: AccountUserWithRole }) {
  const { setSelectedUser } = useUserStore();
  const navigate = useNavigate();
  const { mutate: resendInvitation, isPending: isResending } =
    useResendInvitation({
      onSuccess: () => {
        notify.success("Invitation URL generated successfully");
      },
      onError: () => {
        notify.error("Error generating invitation URL");
      },
    });
  const { mutate: deleteInvitation, isPending: isRevoking } =
    useRevokeInvitation({
      onSuccess: () => {
        notify.success("Invitation revoked successfully");
      },
      onError: () => {
        notify.error("Error revoking invitation");
      },
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

  const resendInvite = () => {
    resendInvitation(user.invitation_id);
  };

  const revokeInvite = () => {
    deleteInvitation(user.invitation_id);
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
              <SubmitLink onClick={resendInvite} disabled={isResending}>
                {isResending ? (
                  <CircularProgress size={15} />
                ) : (
                  "Resend Email Invite"
                )}
              </SubmitLink>
            )}
            <When condition={isPending}>
              <SubmitLink onClick={onUserClick}>
                {isRevoking ? <CircularProgress size={15} /> : "Revoke User"}
              </SubmitLink>
            </When>
            <When condition={!isPending}>
              <SubmitLink onClick={onUserClick}>
                View/Edit User Access
              </SubmitLink>
            </When>
          </Box>
        )}
      </PlainTableCell>
    </TableRow>
  );
}
