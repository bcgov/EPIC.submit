import { useMemo, useState, useCallback } from "react";
import { Proponent } from "@/models/Proponent";
import { TableCell, TableRow } from "@mui/material";
import { Invitation, InvitationStatus } from "@/models/Invitation";
import { PlainTableCell } from "@/components/Shared/Table/common";
import { RegistrationUrlCell } from "./RegistrationUrlCell";

type EntityTableBodyProps = {
  isError: boolean;
  proponent: Proponent;
};

export const ProjectTableBody = ({
  proponent: initialProponent,
  isError,
}: EntityTableBodyProps) => {
  const [proponent, setProponent] = useState<Proponent>(initialProponent);

  const addInvitation = useCallback((invitation: Invitation) => {
    setProponent((prevProponent) => ({
      ...prevProponent,
      invitations: [...(prevProponent.invitations || []), invitation],
    }));
  }, []);

  const { pendingInvitations, usedInvitations } = useMemo(() => {
    const pendingMap = new Map<number, Invitation>();
    const usedMap = new Map<number, Invitation[]>();

    proponent.invitations?.forEach((invitation) => {
      invitation.project_ids.forEach((project_id) => {
        // Track only USED invitations
        if (invitation.status === InvitationStatus.USED) {
          if (!usedMap.has(project_id)) {
            usedMap.set(project_id, []);
          }
          usedMap.get(project_id)?.push(invitation);
        }
        // Track pending ones separately
        else if (invitation.status === InvitationStatus.PENDING) {
          pendingMap.set(project_id, invitation);
        }
      });
    });

    return { pendingInvitations: pendingMap, usedInvitations: usedMap };
  }, [proponent.invitations]);

  if (isError) {
    return (
      <TableRow>
        <TableCell align="center">Error fetching proponents</TableCell>
      </TableRow>
    );
  }

  if (!proponent.projects?.length) {
    return (
      <TableRow>
        <TableCell>No proponents found</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {proponent.projects.map((project) => (
        <TableRow key={project.id}>
          <PlainTableCell>{project.name}</PlainTableCell>
          <RegistrationUrlCell
            pendingInvitation={pendingInvitations.get(project.id)}
            usedProjectInvitations={usedInvitations.get(project.id) || []}
            project={project}
            addInvitation={addInvitation}
          />
        </TableRow>
      ))}
    </>
  );
};
