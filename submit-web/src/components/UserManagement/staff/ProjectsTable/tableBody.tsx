import { useMemo, useState, useCallback } from "react";
import { Proponent } from "@/models/Proponent";
import { TableCell, TableRow, Link as MuiLink } from "@mui/material";
import { Invitation } from "@/models/Invitation";
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

  const projectInvitationMap = useMemo(() => {
    const map = new Map<number, Invitation>();
    proponent.invitations?.forEach((invitation) => {
      invitation.project_ids.forEach((project_id) => {
        map.set(project_id, invitation);
      });
    });
    return map;
  }, [proponent.invitations]);

  const projectAccountProjectMap = useMemo(() => {
    const map = new Map<number, number>();
    proponent.account_projects?.forEach((account_project) => {
      map.set(account_project.project_id, account_project.id);
    });
    return map;
  }, [proponent.account_projects]);

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
          <PlainTableCell>
            <MuiLink
              sx={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                "&:hover": {
                  textDecoration: "underline",
                  cursor: "pointer",
                },
              }}
            >
              {project.name}
            </MuiLink>
          </PlainTableCell>
          <RegistrationUrlCell
            pendingInvitation={projectInvitationMap.get(project.id)}
            accountProjectId={projectAccountProjectMap.get(project.id)}
            project={project}
            addInvitation={addInvitation}
          />
        </TableRow>
      ))}
    </>
  );
};
