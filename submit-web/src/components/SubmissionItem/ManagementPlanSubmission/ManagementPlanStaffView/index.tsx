import * as yup from "yup";
import { useMemo } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { booleanToString } from "@/utils";
import { useGetSubmissionItemForStaff } from "@/hooks/api/useItems";
import FormFieldSection from "./FormFieldSection";
import InternalDocumentSection from "../../InternalDocumentSection";
import ReviewSection from "./ReviewSection";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";

const managementPlanSubmissionSchema = yup.object().shape({
  conditionSatisfied: yup.string().required("Please answer this question."),
  allRequirementsAddressed: yup
    .string()
    .required("Please answer this question."),
  informationAccurate: yup.string().required("Please answer this question."),
  managementPlans: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
  supportingDocuments: yup.array().of(yup.string()),
  notes: yup.string(),
});

export type ManagementPlanSubmissionForm = yup.InferType<
  typeof managementPlanSubmissionSchema
>;
export const ManagementPlanSubmissionStaffView = () => {
  const { projectId: accountProjectIdParam, submissionId: submissionItemId } =
    useParams({
      from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
    });

  const accountProjectId = Number(accountProjectIdParam);

  const { data: accountProject } = useGetAccountProjectForStaff({
    accountProjectId,
  });

  const { data: submissionItem } = useGetSubmissionItemForStaff({
    itemId: Number(submissionItemId),
  });

  const formSubmission = submissionItem?.submissions?.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
  );

  const formData = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      conditionSatisfied: booleanToString(
        formSubmission.submitted_form.submission_json.conditionSatisfied,
      ),
      allRequirementsAddressed: booleanToString(
        formSubmission.submitted_form.submission_json.allRequirementsAddressed,
      ),
      informationAccurate: booleanToString(
        formSubmission.submitted_form.submission_json.informationAccurate,
      ),
      notes: formSubmission.submitted_form.submission_json?.notes,
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
