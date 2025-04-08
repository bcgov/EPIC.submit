import {
  Box,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useMemo } from "react";
import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import ControlledCheckboxGroup from "@/components/Shared/controlled/ControlledCheckboxGroup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import WarningBox from "@/components/Shared/WarningBox";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import Stack from "@mui/material/Stack";

type AddRequestSectionProps = {
  readonly disabled?: boolean;
};
export default function AddRequestSection({
  disabled = false,
}: AddRequestSectionProps) {
  const { submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey
  );
  const filteredItems = useMemo(() => {
    if (!submissionPackage?.items) return [];
    return submissionPackage.items.filter(
      (item) =>
        item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD
    );
  }, [submissionPackage?.items]);

  return (
    <Box
      sx={{
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        backgroundColor: "#FFF",
        padding: "8px 16px",
        borderRadius: "4px",
      }}
    >
      <Typography variant="body1" fontWeight={"bold"}>
        Revision Required for
      </Typography>
      <ControlledCheckboxGroup
        name="update_request.submission_item_types"
        disabled={disabled}
      >
        {filteredItems.map((item) => (
          <FormControlLabel
            key={item.id}
            control={<Checkbox value={item.type_id} />}
            label={item.type.name}
          />
        ))}
      </ControlledCheckboxGroup>
      <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
        <Typography variant="body1" fontWeight={"bold"}>
          EAO Comment
        </Typography>
        <ControlledTextField
          name="update_request.reason"
          variant="outlined"
          multiline
          fullWidth
          minRows={4}
          sx={{
            "& .MuiInputBase-root": {
              borderColor: BCDesignTokens.typographyColorDisabled,
            },
            marginBottom: 0,
          }}
          disabled={disabled}
        />
        <FormHelperText>
          This request will be sent to the Holder after a Manager confirms the
          decision.
        </FormHelperText>
      </Box>
      <WarningBox mb={BCDesignTokens.layoutMarginXsmall}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <PriorityHighIcon fontSize="large" />
          <Typography variant="body1" color="inherit">
            This request, including the EAO Comment, will be sent to the holder
            after a Manager confirms the decision.
          </Typography>
        </Stack>
      </WarningBox>
    </Box>
  );
}
