import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useMemo } from "react";
import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import ControlledCheckboxGroup from "@/components/Shared/controlled/ControlledCheckboxGroup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getStaffSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";

export default function AddRequestSection() {
  const { submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getStaffSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );
  const filteredItems = useMemo(() => {
    if (!submissionPackage?.items) return [];
    return submissionPackage.items.filter(
      (item) =>
        item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD,
    );
  }, [submissionPackage?.items]);

  return (
    <Box mt="20px">
      <Typography variant="body1">Revision Required for</Typography>
      <ControlledCheckboxGroup name="update_request.submission_item_ids">
        {filteredItems.map((item) => (
          <FormControlLabel
            key={item.id}
            control={<Checkbox value={item.id} />}
            label={item.type.name}
          />
        ))}
      </ControlledCheckboxGroup>
      <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
        <Typography variant="body1">Request reason</Typography>
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
          }}
        />
      </Box>
    </Box>
  );
}
