import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { Submission } from "@/models/Submission";
import { useGetSubmissionVersions } from "@/hooks/api/useSubmissions";
import DocumentSubRow from "./DocumentSubRow";
import { useMemo } from "react";

type DocumentsSubTableProps = Readonly<{
  submission: Submission;
}>;
export default function DocumentsSubTable({
  submission,
}: DocumentsSubTableProps) {
  const { data: submissions, isPending: isSubmissionsLoading } =
    useGetSubmissionVersions(submission.id);

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((sub) => sub.id !== submission.id);
  }, [submissions]);

  if (isSubmissionsLoading) {
    return (
      <Table sx={{ tableLayout: "fixed" }}>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} align="center">
              <CircularProgress size={18} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <Table sx={{ tableLayout: "fixed" }}>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} align="center"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table sx={{ tableLayout: "fixed" }}>
      <TableBody>
        {filteredSubmissions?.map((submission) => (
          <DocumentSubRow key={submission.id} documentSubmission={submission} />
        ))}
      </TableBody>
    </Table>
  );
}
