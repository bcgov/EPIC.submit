import { useMemo } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { SUBMISSION_TYPE } from "@/models/Submission";
import InternalDocumentSection from "../../InternalDocumentSection";
import FormFieldSection from "./FormFieldSection";
import { useGetSubmissionItemForStaff } from "@/hooks/api/useItems";
import ReviewSection from "./ReviewSection";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import { useQueryClient } from "@tanstack/react-query";

export const ConsultationRecordStaffView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const submissionId = Number(submissionItemId);
  const { data: accountProject } = useGetAccountProjectForStaff({
    accountProjectId,
  });

  const { data: submissionItem } = useGetSubmissionItemForStaff({
    itemId: submissionId,
  });

  const formSubmission = submissionItem?.submissions?.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
  );

  const formData = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      allPartiesConsulted:
        formSubmission.submitted_form.submission_json.allPartiesConsulted,
      planWasReviewed:
        formSubmission.submitted_form.submission_json.planWasReviewed,
      writtenExplanationsProvidedToParties:
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToParties,
      writtenExplanationsProvidedToCommenters:
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToCommenters,
      notes: formSubmission.submitted_form.submission_json.notes,
    };
  }, [formSubmission]);

  const queryClient = useQueryClient();
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const partiesList =
    submissionPackage?.meta?.main_condition?.condition_attributes
      ?.parties_required_to_be_consulted || [];

  if (!accountProject) return <Navigate to="/error" />;

  if (!submissionPackage) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <FormFieldSection
        formData={formData}
        partiesList={partiesList}
        submissionId={submissionId}
        packageType={submissionPackage.type.name}
      />
      <InternalDocumentSection />
      <ReviewSection />
    </SubmissionFormContainer>
  );
};
