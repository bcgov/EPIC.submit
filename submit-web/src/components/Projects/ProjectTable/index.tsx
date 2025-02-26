import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { SubmissionPackage } from "@/models/Package";
import ProjectTableHead from "./TableHead";
import ProjectTableRow from "./ProjectTableRow";
import LayoutTableHead from "./LayoutTableHead";

type ProjectTableProps = Readonly<{
  submissionPackages: Array<SubmissionPackage>;
  headless?: boolean;
}>;
export default function ProjectTable({
  submissionPackages,
  headless,
}: ProjectTableProps) {
  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table>
        {!headless ? <ProjectTableHead /> : <LayoutTableHead />}
        <TableBody>
          {submissionPackages?.map((subPackage) => (
            <ProjectTableRow key={subPackage.id} subPackage={subPackage} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
