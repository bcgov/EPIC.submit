import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dateUtils from "@/utils/dateUtils";
import { UPDATE_REQUEST_TYPE, UpdateRequest } from "@/models/UpdateRequest";
import { Case, Switch, Unless, When } from "react-if";
import { AddRequestNoteSection } from "./AddRequestNoteSection";
import { PACKAGE_STATUS, SubmissionPackage } from "@/models/Package";
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
  const { reason, created_date, created_by, note, type, submission_item_ids } =
    updateRequest;
  const createdDate = dateUtils.formatDate(created_date);

  const { roles } = useAccount();
  const isEAO = checkIfEAO(roles || []);

  const submissionItems = submissionPackage.items.filter((item) =>
    submission_item_ids.includes(item.id),
  );

  const showNoteSection =
    (isEAO &&
      submissionPackage.status.includes(PACKAGE_STATUS.SUBMITTED.value)) ||
    (!isEAO && Boolean(note));

  return (
    <Box sx={{ my: BCDesignTokens.layoutMarginLarge }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "space-between",
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {created_by}
        </Typography>
        <Typography variant="body1">{createdDate}</Typography>
      </Box>

      <Typography
        variant="body1"
        sx={{ mb: 1, fontWeight: BCDesignTokens.typographyFontWeightsBold }}
      >
        <Switch>
          <Case condition={type === UPDATE_REQUEST_TYPE.REVIEW.value}>
            Revision required for{" "}
            {submissionItems.map((item) => item.type.name).join(", ")}
          </Case>
          <Case condition={type === UPDATE_REQUEST_TYPE.UPDATE.value}>
            Update requested for{" "}
            {submissionItems.map((item) => item.type.name).join(", ")}
          </Case>
        </Switch>
      </Typography>

      <Typography variant="body1" sx={{ mb: 1 }}>
        {reason}
      </Typography>

      <When condition={showNoteSection}>
        <Typography
          variant="body1"
          sx={{ mb: 1, fontWeight: BCDesignTokens.typographyFontWeightsBold }}
        >
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
