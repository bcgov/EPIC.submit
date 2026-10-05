import { Box, Grid, Typography } from "@mui/material";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import ControlledDatePicker from "@/components/Shared/ControlledFormFields/ControlledDatePicker";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs from "dayjs";
import OpenUpdateRequestsAlertModal from "./OpenUpdateRequestsAlertModal";

const ApproveSubmissionFormSchema = yup.object().shape({
  decisionDate: yup
    .date()
    .transform((value, original) =>
      dayjs.isDayjs(original) ? original.toDate() : value,
    )
    .required("Decision Date is required"),
});

type ApproveSubmissionForm = yup.InferType<typeof ApproveSubmissionFormSchema>;

type ApproveSubmissionModalProps = {
  onConfirm: (data: ApproveSubmissionForm) => void;
  onCancel: () => void;
  hasOpenUpdateRequests: boolean;
  openRequestSectionNames: string[];
};

const ApproveSubmissionModal = ({
  onConfirm,
  onCancel,
  hasOpenUpdateRequests,
  openRequestSectionNames,
}: ApproveSubmissionModalProps) => {
  const methods = useForm<ApproveSubmissionForm>({
    resolver: yupResolver(ApproveSubmissionFormSchema),
    mode: "onChange",
    defaultValues: {
      decisionDate: new Date(),
    },
  });

  // Show alert modal when there are open update requests
  if (hasOpenUpdateRequests) {
    return (
      <OpenUpdateRequestsAlertModal
        onClose={onCancel}
        openRequestSectionNames={openRequestSectionNames}
      />
    );
  }

  // Show confirmation modal when no blocking requests
  return (
    <ConfirmationModal
      title="Approve Submission"
      onConfirm={methods.handleSubmit((data) => {
        onConfirm(data);
      })}
      onSecondaryAction={onCancel}
      confirmText="Approve Submission"
      secondaryActionText="Cancel"
      confirmDisabled={!methods.formState.isValid}
      description={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "520px",
          }}
        >
          <Typography variant="body1">
            You are confirming this Initial Project Description &amp; Engagement
            Plan is approved.
          </Typography>
          <Typography variant="body1">
            This decision will be recorded internally. No further changes can be
            made to this package after it has been approved.
          </Typography>
          <FormProvider {...methods}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight={"bold"}>
                  Decision Date
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ pt: "0px !important" }}>
                <ControlledDatePicker
                  name="decisionDate"
                  disableFuture
                  sx={{ mb: 0 }}
                />
              </Grid>
            </Grid>
          </FormProvider>
        </Box>
      }
    />
  );
};

export default ApproveSubmissionModal;
