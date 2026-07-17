import UserStatusChip from "@/components/App/UserStatusChip";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PlainTableCell } from "@/components/Shared/Table/common";
import { SubmitLink } from "@/components/Shared/Text/SubmitLink";
import {
  useResendInvitation,
  useRevokeInvitation,
} from "@/hooks/api/useInvitations";
import { AccountUserWithRole } from "@/models/AccountUser";
import { InvitationStatus } from "@/models/Invitation";
import { roleDetails, USER_MANAGEMENT_ROLE } from "@/models/Role";
import InfoIcon from "@mui/icons-material/Info";
import {
  Box,
  CircularProgress,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useUserStore } from "./userStore";
import { useModal } from "@/components/Shared/Modals/modalStore";

export default function UserTableRow({ user }: { user: AccountUserWithRole }) {
  const { setSelectedUser } = useUserStore();
  const navigate = useNavigate();
  const { setOpen: setOpenModal, setClose: setCloseModal } = useModal();

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
  const isSpecificSubmissionContributor =
    user?.role?.role_name ===
    USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR;

  const openRevokeModal = () => {
    setOpenModal(
      <ConfirmationModal
        onConfirm={() => {
          revokeInvite();
        }}
        title="Revoke Invitation"
        description={
          <>
            <Typography variant="body1">
              This action will revoke access to EPIC.submit. The invitation link
              sent in the email to this user will be disabled and the user will
              be deleted from the system. Once access is revoked, if you want to
              invite the user again, you will have to create a new invitation by
              clicking the “+ Add New User” button.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Please confirm you want to revoke this invitation.
            </Typography>
          </>
        }
        confirmText="Confirm"
      />,
    );
  };

  const onUserClick = () => {
    if (isPending) {
      openRevokeModal();
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
    setCloseModal();
  };

  return (
    <TableRow key={user.id}>
      <PlainTableCell align="left" width={"10%"}>
        <Typography
          variant="body1"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "200px",
          }}
        >
          {user.work_email_address}
        </Typography>
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
        <Typography variant="body1">
          {!isPending && !isRevoked && user.full_name}
        </Typography>
      </PlainTableCell>
      <PlainTableCell align="left" width={"30%"}>
        <When condition={isSpecificSubmissionContributor}>
          <Tooltip
            title={
              <Box>
                {user.role.package_names?.map((packageName) => (
                  <Typography
                    key={packageName}
                    variant="body2"
                    sx={{ color: BCDesignTokens.typographyColorPrimaryInvert }}
                  >
                    • {packageName}
                  </Typography>
                )) || "No packages assigned"}
              </Box>
            }
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {roleDetails[user.role.role_name]?.label}
              <InfoIcon
                fontSize="small"
                sx={{ color: BCDesignTokens.typographyColorPrimary }}
              />
            </span>
          </Tooltip>
        </When>
        <When condition={user?.role && !isSpecificSubmissionContributor}>
          {roleDetails[user.role.role_name]?.label}
        </When>
      </PlainTableCell>
      <PlainTableCell align="left" width={"10%"}>
        <UserStatusChip status={user.status} />
      </PlainTableCell>
      <PlainTableCell align="left" width={"25%"}>
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
                {isRevoking ? (
                  <CircularProgress size={15} />
                ) : (
                  "Revoke Invitation"
                )}
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
