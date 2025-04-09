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
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { useGetSubmissionItem } from "@/hooks/api/useItems";
import { useMemo, useState } from "react";
import { AddDocumentActionButton } from "./AddDocumentActionButton";
import { useQueryClient } from "@tanstack/react-query";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { camelCase } from "lodash";

type DocumentsTableProps = Readonly<{
  folder: string;
}>;
export default function DocumentsTable({ folder }: DocumentsTableProps) {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const [addedSubmissions, setAddedSubmissions] = useState<Submission[]>([]);

  const { data: submissionItem, isPending: isItemLoading } =
    useGetSubmissionItem({
      itemId: Number(submissionItemId),
    });

  const documentSubmissions = useMemo(() => {
    if (!submissionItem) {
      return addedSubmissions;
    }
    const submissions = submissionItem.submissions.filter(
      (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
    );
    return [...submissions, ...addedSubmissions];
  }, [submissionItem, addedSubmissions]);

  if (isItemLoading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const handleAddSubmission = (submission: Submission) => {
    setAddedSubmissions((prev) => [...prev, submission]);
  };

  if (!submissionItem) {
    return null;
  }

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey
  );
  const projectName = camelCase(accountProject?.project.name ?? "");

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
            <SubmitPrimaryRowTableCell colSpan={2} />
            <SubmitPrimaryRowTableCell align="right">
              <AddDocumentActionButton
                folder={folder}
                folderPath={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${folder}/`}
                handleAddDocument={handleAddSubmission}
              />
            </SubmitPrimaryRowTableCell>
          </SubmitTablePrimaryRow>
          {documentSubmissions.map((documentSubmission) => (
            <Row
              key={documentSubmission.id}
              documentSubmission={documentSubmission}
              folderPath={`${S3_FOLDER.SUBMISSIONS}/${projectName}/${folder}/`}
            />
          ))}
        </TableBody>
      </MuiTable>
    </SubmitTableContainer>
  );
}
