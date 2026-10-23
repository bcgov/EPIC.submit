// Report types whose primary upload section is labelled "Upload Notification"
// rather than "Upload Report".
export const NOTIFICATION_REPORT_TYPES = [
  "Compliance Notification",
  "Project Status Notification",
];

export const PRIMARY_UPLOAD_LABEL_REPORT = "Upload Report";
export const PRIMARY_UPLOAD_LABEL_NOTIFICATION = "Upload Notification";

/**
 * Returns the primary upload-section label for a report obligation:
 * "Upload Notification" for notification types, otherwise "Upload Report".
 */
export const getPrimaryUploadLabel = (reportType?: string | null): string => {
  if (reportType && NOTIFICATION_REPORT_TYPES.includes(reportType)) {
    return PRIMARY_UPLOAD_LABEL_NOTIFICATION;
  }
  return PRIMARY_UPLOAD_LABEL_REPORT;
};

// Accepted file extensions per section.
export const PRIMARY_ACCEPTED_FILE_TYPES = ["pdf"];
export const SUPPORTING_ACCEPTED_FILE_TYPES = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
];

export const PRIMARY_UPLOAD_CRITERIA =
  "Must be unlocked PDF document (i.e., not password protected).";
export const SUPPORTING_UPLOAD_DESCRIPTION = "e.g. appendices, data tables";

export const PRIMARY_REQUIRED_ERROR = "Please upload a document.";
export const SUBMIT_SUCCESS_MESSAGE = "Documents submitted successfully";
export const SUBMIT_FAILURE_MESSAGE =
  "Something went wrong submitting your documents. Please try again.";
