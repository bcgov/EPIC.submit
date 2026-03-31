import * as yup from "yup";

export const engagementPlanSubmissionSchema = yup.object().shape({
  engagementPlan: yup.array().of(yup.string()),
  supportingEngagementPlan: yup.array().of(yup.string()),
});

export type EngagementPlanSubmissionForm = yup.InferType<typeof engagementPlanSubmissionSchema>;

export const ENGAGEMENT_PLAN_DOCUMENT_FOLDERS = Object.freeze({
  ENGAGEMENT_PLAN: "engagement_plan",
  SUPPORTING_ENGAGEMENT_PLAN: "supporting_engagement_plan",
});
