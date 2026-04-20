import {
  Box,
  CircularProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { Submission } from "@/models/Submission";
import { useGetSubmissionVersions } from "@/hooks/api/useSubmissions";
import DocumentSubRow from "./DocumentSubRow";
import { useMemo, useState } from "react";
import { PackageType } from "@/models/Package";
import ItemsTableHead from "./ItemsTableHead";
import { useMounted } from "@/hooks/common";

type DocumentsSubTableProps = Readonly<{
  submission: Submission;
  packageType?: PackageType;
}>;
export default function DocumentsSubTable({
  submission,
  packageType,
}: DocumentsSubTableProps) {
  const { data: submissions, isPending: isSubmissionsLoading } =
    useGetSubmissionVersions(submission.id);
  const [expanded, setExpanded] = useState(false);

  useMounted(() => {
    setExpanded(true);
  });

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((sub) => sub.id !== submission.id);
  }, [submissions, submission.id]);

  if (isSubmissionsLoading) {
    return (
      <Collapse in={expanded}>
        <Table sx={{ tableLayout: "fixed" }}>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} align="center">
                <CircularProgress size={18} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Collapse>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <Collapse in={expanded}>
        <Table sx={{ tableLayout: "fixed" }}>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} align="center">
                Could not load previous versions
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Collapse>
    );
  }

  return (
    <Collapse in={expanded}>
      <Box sx={{ padding: "1em" }}>
        <Typography variant="h6" gutterBottom>
          Previous Submitted Versions
        </Typography>
        <Table sx={{ tableLayout: "fixed" }}>
          <ItemsTableHead packageType={packageType} />
          <TableBody>
            {filteredSubmissions?.map((submission) => (
              <DocumentSubRow
                key={submission.id}
                documentSubmission={submission}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Collapse>
  );
}
