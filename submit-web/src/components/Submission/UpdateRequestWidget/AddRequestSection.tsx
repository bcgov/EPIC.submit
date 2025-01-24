import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useMemo } from "react";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_ITEM_METHOD } from "@/models/SubmissionItem";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Form from "@/components/Shared/Forms/common";
import ControlledCheckboxGroup from "@/components/Shared/controlled/ControlledCheckboxGroup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";

const requestUpdateSchema = yup.object().shape({
  reason: yup.string().required("Please enter the reason."),
  submissionItems: yup
    .array()
    .nullable()
    .required("Please select at least one item.")
    .of(yup.string())
    .min(1, "Please select at least one item."),
});
type RequestUpdateForm = yup.InferType<typeof requestUpdateSchema>;

type AddRequestSectionProps = {
  readonly submissionPackage: SubmissionPackage;
  readonly isCreatingUpdateRequest: boolean;
  readonly handleCreateUpdateRequest: ({
    reason,
    submissionItems,
  }: {
    reason: string;
    submissionItems: unknown[];
  }) => void;
  readonly handleCancelReason: () => void;
};

export default function AddRequestSection({
  submissionPackage,
  handleCreateUpdateRequest,
  isCreatingUpdateRequest,
  handleCancelReason,
}: AddRequestSectionProps) {
  const methods = useForm<RequestUpdateForm>({
    resolver: yupResolver(requestUpdateSchema),
    mode: "onSubmit",
    defaultValues: {
      reason: "",
      submissionItems: [],
    },
  });

  const { handleSubmit } = methods;

  const onCreateUpdateRequest = async (data: RequestUpdateForm) => {
    const validData = requestUpdateSchema.validateSync(data);
    const { reason, submissionItems } = validData;
    handleCreateUpdateRequest({
      reason: reason,
      submissionItems: submissionItems,
    });
  };

  const filteredItems = useMemo(() => {
    return submissionPackage.items.filter(
      (item) =>
        item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD
    );
  }, [submissionPackage.items]);

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onCreateUpdateRequest)}>
        <Box>
          <Typography
            variant="body1"
            sx={{
              pt: BCDesignTokens.layoutPaddingLarge,
              fontWeight: BCDesignTokens.typographyBoldBody,
              mb: BCDesignTokens.layoutMarginSmall,
            }}
          >
            Update requested for
          </Typography>
          <ControlledCheckboxGroup name="submissionItems">
            {filteredItems.map((item) => (
              <FormControlLabel
                key={item.id}
                control={<Checkbox value={item.id} sx={{ py: 0 }} />}
                label={item.type.name}
              />
            ))}
          </ControlledCheckboxGroup>
          <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: BCDesignTokens.typographyBoldBody,
                pt: BCDesignTokens.layoutPaddingLarge,
                mb: BCDesignTokens.layoutMarginSmall,
              }}
            >
              Request reason
            </Typography>
            <ControlledTextField
              name="reason"
              variant="outlined"
              multiline
              fullWidth
              minRows={4}
              sx={{
                "& .MuiInputBase-root": {
                  borderColor: BCDesignTokens.typographyColorDisabled,
                },
                mb: BCDesignTokens.layoutMarginSmall,
              }}
            />
            <LoadingButton
              type="submit"
              sx={{ mr: BCDesignTokens.layoutMarginSmall }}
              loading={isCreatingUpdateRequest}
            >
              Send Request to Holder
            </LoadingButton>
            <Button
              color="secondary"
              onClick={handleCancelReason}
              sx={{ border: "0px" }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Form>
    </FormProvider>
  );
}
