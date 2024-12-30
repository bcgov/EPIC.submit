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
  note: yup.string().required("Please enter your note."),
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
    note,
    submissionItems,
  }: {
    note: string;
    submissionItems: unknown[];
  }) => void;
  readonly handleCancelNote: () => void;
};

export default function AddRequestSection({
  submissionPackage,
  handleCreateUpdateRequest,
  isCreatingUpdateRequest,
  handleCancelNote,
}: AddRequestSectionProps) {
  const methods = useForm<RequestUpdateForm>({
    resolver: yupResolver(requestUpdateSchema),
    mode: "onSubmit",
    defaultValues: {
      note: "",
      submissionItems: [],
    },
  });

  const { handleSubmit } = methods;

  const onCreateUpdateRequest = async (data: RequestUpdateForm) => {
    const validData = requestUpdateSchema.validateSync(data);
    const { note, submissionItems } = validData;
    handleCreateUpdateRequest({
      note: note,
      submissionItems: submissionItems,
    });
  };

  const filteredItems = useMemo(() => {
    return submissionPackage.items.filter(
      (item) =>
        item.type.submission_method === SUBMISSION_ITEM_METHOD.DOCUMENT_UPLOAD,
    );
  }, [submissionPackage.items]);

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onCreateUpdateRequest)}>
        <Box>
          <Typography variant="body1">Update requested for</Typography>
          <ControlledCheckboxGroup name="submissionItems">
            {filteredItems.map((item) => (
              <FormControlLabel
                key={item.id}
                control={<Checkbox value={item.id} />}
                label={item.type.name}
              />
            ))}
          </ControlledCheckboxGroup>
          <Box sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">Request Note</Typography>
            <ControlledTextField
              name="note"
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
            <LoadingButton
              type="submit"
              sx={{ mr: BCDesignTokens.layoutMarginSmall }}
              loading={isCreatingUpdateRequest}
            >
              Send Request to Holder
            </LoadingButton>
            <Button
              color="secondary"
              onClick={handleCancelNote}
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
