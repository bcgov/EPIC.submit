import {
  Table as MuiTable,
  TableBody,
  TableRow,
  Typography,
} from "@mui/material";
import {
  SubmitPrimaryRowTableCell,
  SubmitTableContainer,
  SubmitTableHead,
  SubmitTableHeadCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { SubmissionItem } from "@/models/SubmissionItem";
import Row from "./Row";
import { SUBMISSION_TYPE } from "@/models/Submission";

export default function DocumentsTable() {
  const { submissionId: submissionItemId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    submissionItemId,
  ]);

  const documentSubmissions =
    submissionItem?.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    ) || [];

  if (!submissionItem) {
    return null;
  }
  return (
    <SubmitTableContainer>
      <MuiTable>
        <SubmitTableHead>
          <TableRow>
            <SubmitTableHeadCell>
              <Typography>Form/Document</Typography>
            </SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Uploaded by</SubmitTableHeadCell>
            <SubmitTableHeadCell align="right">Version</SubmitTableHeadCell>
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </SubmitTableHead>
        <TableBody>
          <SubmitTablePrimaryRow>
            <SubmitPrimaryRowTableCell>
              <Typography>Management Plan</Typography>
            </SubmitPrimaryRowTableCell>
            <SubmitPrimaryRowTableCell colSpan={3}></SubmitPrimaryRowTableCell>
          </SubmitTablePrimaryRow>
          {documentSubmissions.map((documentSubmission) => (
            <Row
              key={documentSubmission.id}
              documentSubmission={documentSubmission}
            />
          ))}
        </TableBody>
      </MuiTable>
    </SubmitTableContainer>
  );
}
