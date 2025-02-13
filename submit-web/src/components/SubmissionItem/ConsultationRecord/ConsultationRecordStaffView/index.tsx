import { useMemo } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { SUBMISSION_TYPE } from "@/models/Submission";
import InternalDocumentSection from "../../InternalDocumentSection";
import FormFieldSection from "./FormFieldSection";
import { useGetSubmissionItemForStaff } from "@/hooks/api/useItems";
import ReviewSection from "./ReviewSection";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";

export const ConsultationRecordStaffView = () => {
  const { projectId: accountProjectIdParam, submissionId: submissionItemId } =
    useParams({
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
    };
  }, [formSubmission]);

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <FormFieldSection formData={formData} />
      <InternalDocumentSection />
      <ReviewSection />
    </SubmissionFormContainer>
  );
};
