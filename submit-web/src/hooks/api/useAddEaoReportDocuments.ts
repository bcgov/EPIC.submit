import { useQueryClient } from "@tanstack/react-query";
import { S3_FOLDER, UploadDestination } from "@/models/documentUploadConfig";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { StagedFile } from "@/components/App/Projects/ReportDetail/upload/ReportUploadSection";
import { saveObject } from "./useObjectStorage";
import {
  createEaoDocumentSubmission,
  deleteSubmission,
} from "./useSubmissions";
import { QUERY_KEY } from "./constants";

export type AddEaoReportDocumentsParams = {
  itemId: number;
  // Camel-cased project name used to build the storage folder.
  projectName: string;
  // YYYY-MM-DD date the EAO received the documents; applies to every file.
  receivedDate: string;
  primaryFiles: StagedFile[];
  supportingFiles: StagedFile[];
};

type UploadedFile = {
  name: string;
  url: string;
  destination: UploadDestination;
};

const uploadToStorage = async (
  staged: StagedFile[],
  destination: UploadDestination,
  projectName: string,
): Promise<UploadedFile[]> => {
  const folder = getSubmissionFolderName({
    projectName,
    sectionName: destination.value,
  });
  const uploaded: UploadedFile[] = [];
  for (const { file } of staged) {
    const url = await saveObject({
      file,
      fileDetails: { filename: file.name, folder },
    });
    uploaded.push({ name: file.name, url, destination });
  }
  return uploaded;
};

/**
 * Saves every staged file to the report as an EAO-uploaded document, or none.
 *
 * Files go to storage first, then one record is created per file. If any record
 * fails, the records already created are deleted again before the error is
 * rethrown, so nothing is left partly saved.
 */
export const addEaoReportDocuments = async ({
  itemId,
  projectName,
  receivedDate,
  primaryFiles,
  supportingFiles,
}: AddEaoReportDocumentsParams): Promise<number[]> => {
  const files = [
    ...(await uploadToStorage(primaryFiles, S3_FOLDER.REPORTS, projectName)),
    ...(await uploadToStorage(
      supportingFiles,
      S3_FOLDER.REPORT_SUPPORTING_DOCUMENTS,
      projectName,
    )),
  ];

  const createdIds: number[] = [];
  try {
    for (const { name, url, destination } of files) {
      const created = await createEaoDocumentSubmission(
        itemId,
        destination,
        { name, url },
        receivedDate,
      );
      createdIds.push(created.id);
    }
  } catch (error) {
    await Promise.allSettled(createdIds.map((id) => deleteSubmission(id)));
    throw error;
  }
  return createdIds;
};

export const useAddEaoReportDocuments = (packageId: number) => {
  const queryClient = useQueryClient();

  const addDocuments = async (params: AddEaoReportDocumentsParams) => {
    const ids = await addEaoReportDocuments(params);
    await queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
    });
    return ids;
  };

  return { addDocuments };
};
