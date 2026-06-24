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
import { useEffect, useMemo, useState } from "react";
import { AddDocumentActionButton } from "./AddDocumentActionButton";
import { useQueryClient } from "@tanstack/react-query";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { AccountProject } from "@/models/Project";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { camelCase } from "lodash";
import { getSubmissionItemLabel } from "@/utils";

type DocumentsTableProps = Readonly<{
  folder: string;
  setIsPendingUpload: React.Dispatch<React.SetStateAction<boolean>>;
  isGeoSpatial?: boolean;
  onDocumentClick?: (documentItem: Submission) => void;
  onUploadComplete?: (submission: Submission) => void;
}>;
export default function DocumentsTable({
  folder,
  setIsPendingUpload,
  isGeoSpatial = false,
  onDocumentClick,
  onUploadComplete,
}: DocumentsTableProps) {
  const { submissionId: submissionItemId, projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>(
    getAccountProjectQueryOptions(Number(projectId)).queryKey,
  );
  const projectName = camelCase(accountProject?.project.name ?? "");

  const [addedSubmissions, setAddedSubmissions] = useState<Submission[]>([]);

  const { data: submissionItem, isPending: isItemLoading } =
    useGetSubmissionItem({
      itemId: Number(submissionItemId),
    });

  // Keep addedSubmissions in sync: drop any entry that was removed from the backend
  useEffect(() => {
    if (!submissionItem) return;
    setAddedSubmissions((prev) =>
      prev.filter((addedSub) =>
        submissionItem.submissions.some((sub) => sub.id === addedSub.id),
      ),
    );
  }, [submissionItem]);

  const documentSubmissions = useMemo(() => {
    if (!submissionItem) {
      return addedSubmissions;
    }
    const submissions = submissionItem.submissions.filter(
      (submission) =>
        submission.type === SUBMISSION_TYPE.DOCUMENT &&
        submission.submitted_document?.folder === folder,
    );
    const filteredAdded = addedSubmissions.filter(
      (addedSub) => !submissions.some((sub) => sub.id === addedSub.id),
    );
    return [...submissions, ...filteredAdded];
  }, [submissionItem, addedSubmissions, folder]);

  if (isItemLoading) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const handleAddSubmission = (submission: Submission) => {
    setAddedSubmissions((prev) => [...prev, submission]);
  };

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
            {isGeoSpatial && (
              <SubmitTableHeadCell align="center">Status</SubmitTableHeadCell>
            )}
            <SubmitTableHeadCell align="center">Actions</SubmitTableHeadCell>
          </TableRow>
        </SubmitTableHead>
        <TableBody>
          <SubmitTablePrimaryRow>
            <SubmitPrimaryRowTableCell>
              <Typography fontWeight={"bold"}>
                {getSubmissionItemLabel(submissionItem.type.name)}
              </Typography>
            </SubmitPrimaryRowTableCell>
            <SubmitPrimaryRowTableCell colSpan={isGeoSpatial ? 3 : 2} />
            <SubmitPrimaryRowTableCell align="right">
              <AddDocumentActionButton
                folder={folder}
                folderPath={`${S3_FOLDER.SUBMISSIONS.value}/${projectName}/${folder}/`}
                handleAddDocument={handleAddSubmission}
                setIsPendingUpload={setIsPendingUpload}
                isGeoSpatial={isGeoSpatial}
                onUploadComplete={onUploadComplete}
              />
            </SubmitPrimaryRowTableCell>
          </SubmitTablePrimaryRow>
          {documentSubmissions.map((documentSubmission) => (
            <Row
              key={documentSubmission.id}
              documentSubmission={documentSubmission}
              folderPath={`${S3_FOLDER.SUBMISSIONS.value}/${projectName}/${folder}/`}
              setIsPendingUpload={setIsPendingUpload}
              isGeoSpatial={isGeoSpatial}
              onDocumentClick={onDocumentClick}
            />
          ))}
        </TableBody>
      </MuiTable>
    </SubmitTableContainer>
  );
}
