import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";
import { UpdateRequest } from "@/models/UpdateRequest";
import { Unless, When } from "react-if";
import { AddRequestNoteSection } from "./AddRequestNoteSection";
import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { checkIfEAO } from "@/components/Shared/PermissionGate/utils";
import { useAccount } from "@/store/accountStore";

type UpdateRequestProps = Readonly<{
  updateRequest: UpdateRequest;
  submissionPackage: SubmissionPackage;
}>;

export default function RequestSection({
  updateRequest,
  submissionPackage,
}: UpdateRequestProps) {
  const { reason, created_date, created_by, note } = updateRequest;
  const createdDate = dayjs(created_date).format("DD-MMM-YYYY");

  const { roles } = useAccount();
  const isEAO = checkIfEAO(roles || []);

  const submissionItems = submissionPackage.items;

  const showNoteSection =
    (isEAO &&
      submissionPackage.status.includes(SUBMISSION_STATUS.SUBMITTED.value)) ||
    (!isEAO && Boolean(note));

  return (
    <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "space-between",
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {created_by}
        </Typography>
        <Typography variant="subtitle1">{createdDate}</Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
        Update requested for
      </Typography>

      <Typography variant="subtitle1">
        <ul>
          {submissionItems.map((item) => (
            <li key={item.id}>{item.type.name}</li>
          ))}
        </ul>
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        {reason}
      </Typography>

      <When condition={showNoteSection}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
          Note to EAO
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          {note}
        </Typography>
      </When>
      <Unless condition={isEAO}>
        <AddRequestNoteSection updateRequest={updateRequest} />
      </Unless>
    </Box>
  );
}
