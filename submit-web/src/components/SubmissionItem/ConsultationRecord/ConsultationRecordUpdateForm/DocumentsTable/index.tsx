import {
  Table as MuiTable,
  Skeleton,
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
import Row from "./Row";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useGetSubmissionItem } from "@/hooks/api/useItems";
import { useMemo } from "react";

export default function DocumentsTable() {
  const { submissionId: submissionItemId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { data: submissionItem, isPending: isItemLoading } =
    useGetSubmissionItem({
      itemId: Number(submissionItemId),
    });

  const documentSubmissions = useMemo(() => {
    if (!submissionItem) {
      return [];
    }
    return submissionItem.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    );
  }, [submissionItem]);

  if (isItemLoading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

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
              <Typography fontWeight={"bold"}>
                {submissionItem.type.name}
              </Typography>
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
