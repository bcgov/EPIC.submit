import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { SubmissionPackage } from "@/models/Package";
import ProjectTableHead from "./TableHead";
import ProjectTableRow from "./ProjectTableRow";
import LayoutTableHead from "./LayoutTableHead";

type ProjectTableProps = Readonly<{
  submissionPackages: Array<SubmissionPackage>;
  headless?: boolean;
  isManagementPlan?: boolean;
}>;
export default function ProjectTable({
  submissionPackages,
  headless,
  isManagementPlan,
}: ProjectTableProps) {
  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table>
        {!headless ? (
          <ProjectTableHead isManagementPlan={isManagementPlan} />
        ) : (
          <LayoutTableHead isManagementPlan={isManagementPlan} />
        )}
        <TableBody>
          {submissionPackages?.map((subPackage) => (
            <ProjectTableRow key={subPackage.id} subPackage={subPackage} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
