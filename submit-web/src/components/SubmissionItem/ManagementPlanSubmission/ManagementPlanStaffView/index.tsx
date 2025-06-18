import { useMemo } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { booleanToString } from "@/utils";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import FormFieldSection from "./FormFieldSection";
import ReviewSection from "./ReviewSection";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useSuspenseQuery } from "@tanstack/react-query";

export const ManagementPlanSubmissionStaffView = () => {
  const { projectId: accountProjectIdParam, submissionId: submissionItemId } =
    useParams({
      from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
    });

  const accountProjectId = Number(accountProjectIdParam);

  const { data: accountProject } = useGetAccountProjectForStaff({
    accountProjectId,
  });

  const { data: submissionItem } = useSuspenseQuery(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
  );

  const formSubmission = submissionItem?.submissions?.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM
  );

  const formData = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      conditionSatisfied: booleanToString(
        formSubmission.submitted_form.submission_json.conditionSatisfied
      ),
      allRequirementsAddressed: booleanToString(
        formSubmission.submitted_form.submission_json.allRequirementsAddressed
      ),
      informationAccurate: booleanToString(
        formSubmission.submitted_form.submission_json.informationAccurate
      ),
      notes: formSubmission.submitted_form.submission_json?.notes,
    };
  }, [formSubmission]);

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <div>
        <FormFieldSection formData={formData} />
        <ReviewSection />
      </div>
    </SubmissionFormContainer>
  );
};
