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
  submission?: Submission;
  packageType?: PackageType;
  submissionId?: number;
  currentDocumentId?: number;
}>;
export default function DocumentsSubTable({
  submission,
  packageType,
  submissionId,
  currentDocumentId,
}: DocumentsSubTableProps) {
  const currentSubmissionId = submissionId ?? submission?.id;
  const { data: submissions, isPending: isSubmissionsLoading } =
    useGetSubmissionVersions(currentSubmissionId ?? 0);
  const [expanded, setExpanded] = useState(false);

  useMounted(() => {
    setExpanded(true);
  });

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    /*   If currentDocumentId is present, it means we are viewing a specific document version
        So we need to filter out the current document version to show in All Documents Listing View
        Otherwise, we are viewing the latest version in the Submission View, 
        so we need to filter out the current submission */
    return currentDocumentId
      ? submissions.filter(
          (sub) => sub.submitted_document_id !== currentDocumentId,
        )
      : submissions.filter((sub) => sub.id !== currentSubmissionId);
  }, [submissions, currentSubmissionId, currentDocumentId]);

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
          <ItemsTableHead />
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
