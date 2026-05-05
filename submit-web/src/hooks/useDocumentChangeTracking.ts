import { useEffect, useState } from "react";
import { SubmissionPackage } from "@/models/Package";

export type DocumentChangeState = {
  [itemTypeId: number]: {
    hasNewDocuments: boolean;
    newDocumentIds: number[];
    lastModified: string | null;
  };
};

type UseDocumentChangeTrackingProps = {
  submissionPackage: SubmissionPackage | undefined;
  enabled?: boolean;
};

export const useDocumentChangeTracking = ({
  submissionPackage,
  enabled = true,
}: UseDocumentChangeTrackingProps): DocumentChangeState => {
  const [documentChanges, setDocumentChanges] = useState<DocumentChangeState>(
    {}
  );

  useEffect(() => {
    if (!enabled || !submissionPackage) {
      return;
    }

    const lastSubmissionDate = submissionPackage.submitted_on
      ? new Date(submissionPackage.submitted_on)
      : null;

    const changes: DocumentChangeState = {};

    submissionPackage.items.forEach((item) => {
      const itemTypeId = item.type_id;

      const newDocumentIds: number[] = [];
      let latestModified: string | null = null;

      item.submissions?.forEach((submission) => {
        const doc = submission.submitted_document;
        if (doc) {
          const submissionDate = submission.created_date
            ? new Date(submission.created_date)
            : null;

          if (submissionDate) {
            if (!lastSubmissionDate || submissionDate > lastSubmissionDate) {
              newDocumentIds.push(doc.id);
            }

            if (
              !latestModified ||
              submissionDate > new Date(latestModified)
            ) {
              latestModified = submission.created_date;
            }
          }
        }
      });

      changes[itemTypeId] = {
        hasNewDocuments: newDocumentIds.length > 0,
        newDocumentIds,
        lastModified: latestModified,
      };
    });

    setDocumentChanges(changes);
  }, [submissionPackage, enabled]);

  return documentChanges;
};
