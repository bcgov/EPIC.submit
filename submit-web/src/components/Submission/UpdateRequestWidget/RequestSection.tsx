import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dateUtils from "@/utils/dateUtils";
import { UPDATE_REQUEST_TYPE, UpdateRequest } from "@/models/UpdateRequest";
import { Case, Switch, When } from "react-if";
import { AddRequestNoteSection } from "./AddRequestNoteSection";
import { SubmissionPackage } from "@/models/Package";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";

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

  const { userType } = useAccount();

  const submissionItems = submissionPackage.items.filter((item) =>
    submission_item_ids.includes(item.id),
  );
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

      <When condition={Boolean(note)}>
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
      <When condition={userType === USER_TYPE.PROPONENT}>
        <AddRequestNoteSection updateRequest={updateRequest} />
      </When>
    </Box>
  );
}
