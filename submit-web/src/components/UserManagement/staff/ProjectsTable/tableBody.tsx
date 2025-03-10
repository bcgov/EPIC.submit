import { useMemo, useState } from "react";
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
  proponent: _proponent,
  isError,
}: EntityTableBodyProps) => {
  const [proponent, setProponent] = useState<Proponent>(_proponent);

  const projects = proponent.projects;

  const addInvitation = (invitation: Invitation) => {
    setProponent((prevProponent) => {
      return {
        ...prevProponent,
        invitations: [...(prevProponent.invitations || []), invitation],
      };
    });
  };

  const project_invitation_map = useMemo(() => {
    const project_invitation_map = new Map<number, Invitation>();
    if (!proponent.projects || !proponent.invitations) {
      return project_invitation_map;
    }
    proponent.invitations.forEach((invitation) => {
      invitation.project_ids.forEach((project_id) => {
        project_invitation_map.set(project_id, invitation);
      });
    });
    return project_invitation_map;
  }, [proponent]);

  const project_account_project_map = useMemo(() => {
    if (!proponent.projects || !proponent.account_projects) {
      return new Map<number, number>();
    }
    const project_account_project_map = new Map<number, number>();
    proponent.account_projects.forEach((account_project) => {
      project_account_project_map.set(
        account_project.project_id,
        account_project.id,
      );
    });
    return project_account_project_map;
  }, [proponent]);

  if (isError) {
    return (
      <TableRow>
        <TableCell align="center">Error fetching proponents</TableCell>
      </TableRow>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <TableRow>
        <TableCell>No proponents found</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {projects.map((project) => (
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
            pendingInvitation={project_invitation_map.get(project.id)}
            accountProjectId={project_account_project_map.get(project.id)}
            project={project}
            addInvitation={addInvitation}
          />
        </TableRow>
      ))}
    </>
  );
};
