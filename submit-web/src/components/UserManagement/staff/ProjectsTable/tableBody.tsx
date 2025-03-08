import { PlainTableCell } from "@/components/Shared/Table/common";
import { Proponent } from "@/models/Proponent";
import { TableCell, Link as MuiLink, TableRow } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

type EntityTableBodyProps = {
  isError: boolean;
  proponent: Proponent;
};
export const ProjectTableBody = ({
  proponent,
  isError,
}: EntityTableBodyProps) => {
  const navigate = useNavigate();

  const handleRowClick = (id: number) => {
    navigate({
      to: `/staff/user-management/entities/${id}`,
    });
  };

  const projects = useMemo(() => {
    const project_id_invitation_map = new Map<number, number>();
  }, [proponent]);

  if (isError) {
    return (
      <TableRow>
        <TableCell align="center">Error fetching proponents</TableCell>
      </TableRow>
    );
  }

  return null;

  //   if (proponents.length === 0) {
  //     return (
  //       <TableRow>
  //         <TableCell>No proponents found</TableCell>
  //       </TableRow>
  //     );
  //   }

  //   return (
  //     <>
  //       {proponents.map((entity) => (
  //         <TableRow key={entity.id}>
  //           <PlainTableCell>
  //             <MuiLink
  //               sx={{
  //                 textDecoration: "none",
  //                 display: "flex",
  //                 alignItems: "center",
  //                 "&:hover": {
  //                   textDecoration: "underline",
  //                   cursor: "pointer",
  //                 },
  //               }}
  //               onClick={() => handleRowClick(entity.id)}
  //             >
  //               {entity.name}
  //             </MuiLink>
  //           </PlainTableCell>
  //         </TableRow>
  //       ))}
  //     </>
  //   );
};
