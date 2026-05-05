import { SubmissionPackage } from "@/models/Package";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { DocumentChangeState } from "@/hooks/useDocumentChangeTracking";

export type UnaddressedSection = {
  itemTypeId: number;
  itemTypeName: string;
};

export const getUnaddressedUpdateRequestSections = (
  submissionPackage: SubmissionPackage,
  documentChanges: DocumentChangeState
): UnaddressedSection[] => {
  const openRequests = submissionPackage.update_requests.filter(
    (req) => req.status === UPDATE_REQUEST_STATUS.OPEN.value && req.active
  );

  const unaddressedSections: UnaddressedSection[] = [];

  openRequests.forEach((request) => {
    request.submission_item_types.forEach((itemTypeId) => {
      const hasNewDocuments = documentChanges[itemTypeId]?.hasNewDocuments;
      
      if (!hasNewDocuments) {
        const item = submissionPackage.items.find(
          (i) => i.type_id === itemTypeId
        );
        
        if (item) {
          unaddressedSections.push({
            itemTypeId,
            itemTypeName: item.type.name,
          });
        }
      }
    });
  });

  return unaddressedSections;
};

export const getItemTypeName = (
  itemTypeId: number,
  items: SubmissionPackage["items"]
): string => {
  const item = items.find((i) => i.type_id === itemTypeId);
  return item?.type.name || "Unknown Section";
};

export const formatUnaddressedSectionsMessage = (
  sections: UnaddressedSection[]
): string => {
  if (sections.length === 0) {
    return "";
  }

  if (sections.length === 1) {
    return `We noticed ${sections[0].itemTypeName} hasn't been updated yet. Do you still want to submit your package to the EAO?`;
  }

  const sectionNames = sections.map((s) => s.itemTypeName);
  const lastSection = sectionNames.pop();
  const otherSections = sectionNames.join(", ");

  return `We noticed ${otherSections} and ${lastSection} haven't been updated yet. Do you still want to submit your package to the EAO?`;
};
