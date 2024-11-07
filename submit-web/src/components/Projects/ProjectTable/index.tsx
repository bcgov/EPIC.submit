import { Box, Table, TableBody, TableContainer } from "@mui/material";
import { SubmissionPackage } from "@/models/Package";
import ProjectTableHead from "./TableHead";
import ProjectTableRow from "./ProjectTableRow";

export default function ProjectTable({
  submissionPackages,
  headless,
}: {
  submissionPackages: Array<SubmissionPackage>;
  headless?: boolean;
}) {
  return (
    <TableContainer component={Box} sx={{ height: "100%" }}>
      <Table sx={{ tableLayout: "fixed", border: 0 }}>
        {!headless && <ProjectTableHead />}
        <TableBody>
          {submissionPackages?.map((subPackage) => (
            <ProjectTableRow key={subPackage.id} subPackage={subPackage} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
