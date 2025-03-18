import { SubmitTableHeadCell } from "@/components/Shared/Table/common";
import { getProponentOptions } from "@/hooks/api/useProponents";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableProps,
  TableRow,
} from "@mui/material";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ProjectTableBody } from "./ProjectTableBody";

export const ProjectsTable = (props: TableProps) => {
  const { proponentId } = useParams({
    from: "/staff/_staffLayout/invitations/entities/$proponentId",
  });
  const { data: proponent, isError } = useSuspenseQuery(
    getProponentOptions(proponentId, {
      includeProjects: true,
      includeInvitations: true,
    })
  );

  useEffect(() => {
    if (isError) {
      notify.error("Error fetching proponent");
    }
  }, [isError]);

  return (
    <Box>
      <TableContainer>
        <Table {...props}>
          <TableHead>
            <TableRow>
              <SubmitTableHeadCell>Projects</SubmitTableHeadCell>
              <SubmitTableHeadCell>URL</SubmitTableHeadCell>
              <SubmitTableHeadCell />
            </TableRow>
          </TableHead>
          <TableBody>
            <ProjectTableBody proponent={proponent} isError={isError} />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
