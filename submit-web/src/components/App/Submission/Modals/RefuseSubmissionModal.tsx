import { Box, Grid, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { Warning } from "@mui/icons-material";
import { BCDesignTokens } from "epic.theme";
import ConfirmationModal from "@/components/Shared/Modals/ConfirmationModal";
import AlertModal from "@/components/Shared/Modals/AlertModal";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";
import ControlledDatePicker from "@/components/Shared/ControlledFormFields/ControlledDatePicker";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs from "dayjs";

const RefuseSubmissionFormSchema = yup.object().shape({
  decisionDate: yup
    .date()
    .transform((value, original) =>
      dayjs.isDayjs(original) ? original.toDate() : value,
    )
    .required("Please enter the decision date"),
  reason: yup.string().optional().nullable(),
});

type RefuseSubmissionForm = yup.InferType<typeof RefuseSubmissionFormSchema>;

type RefuseSubmissionModalProps = {
  onConfirm: (data: RefuseSubmissionForm) => void;
  onCancel: () => void;
  hasOpenUpdateRequests?: boolean;
  openRequestSectionNames?: string[];
};

const RefuseSubmissionModal = ({
  onConfirm,
  onCancel,
  hasOpenUpdateRequests = false,
  openRequestSectionNames = [],
}: RefuseSubmissionModalProps) => {
  const methods = useForm<RefuseSubmissionForm>({
    resolver: yupResolver(RefuseSubmissionFormSchema),
    mode: "onSubmit",
    defaultValues: {
      decisionDate: new Date(),
      reason: "",
    },
  });

  // Show alert modal when there are open update requests
  if (hasOpenUpdateRequests) {
    return (
      <AlertModal
        title="Cannot Reject Package"
        onClose={onCancel}
        closeText="Close"
        description={
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "520px",
            }}
          >
            <WarningBox
              sx={{
                p: 1.5,
                border: "0px",
                borderLeft: `4px solid ${BCDesignTokens.supportBorderColorWarning}`,
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Warning
                  sx={{ color: BCDesignTokens.supportBorderColorWarning }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Package will be Locked
                  </Typography>
                  <Typography variant="body2">
                    Package cannot be rejected while there are open update requests.
                    The following sections have open update requests:{" "}
                    <b>{openRequestSectionNames.join(", ")}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please accept or withdraw all update requests before rejecting this package.
                  </Typography>
                </Box>
              </Box>
            </WarningBox>
          </Box>
        }
      />
    );
  }

  // Show confirmation modal when no blocking requests
  return (
    <ConfirmationModal
      title="Submission package not approved"
      onConfirm={methods.handleSubmit((data) => {
        onConfirm(data);
      })}
      confirmButtonColor="error"
      onSecondaryAction={onCancel}
      confirmText="Confirm Package is NOT Accepted"
      secondaryActionText="Cancel"
      description={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "520px",
          }}
        >
          <WarningBox
            sx={{
              p: 1.5,
              border: "0px",
              borderLeft: `4px solid ${BCDesignTokens.supportBorderColorWarning}`,
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Warning
                sx={{ color: BCDesignTokens.supportBorderColorWarning }}
              />
              <Box>
                <Typography variant="body2">
                  Not approving this package will require the entity to submit a
                  new package. Any open update requests will be cancelled.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, mt: "10px" }}
                >
                  Please confirm this decision has been communicated to the
                  proponent BEFORE clicking the "Confirm Package is NOT
                  Accepted" button as an automated notification will be sent to
                  the proponent when you confirm the decision.
                </Typography>
              </Box>
            </Box>
          </WarningBox>
          <FormProvider {...methods}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight={"bold"}>
                  Decision Date
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ pt: "0px !important" }}>
                <ControlledDatePicker name="decisionDate" sx={{ mb: 0 }} />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight={"bold"}>
                  Reason for not approving this package
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ pt: "0px !important" }}>
                <ControlledTextField
                  name="reason"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide a reason for not approving this package (optional)..."
                  helperText={
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ fontSize: "12px" }}
                    >
                      <strong>Internal note only.</strong> This reason will be
                      recorded in the submission history.
                    </Typography>
                  }
                  maxLength={500}
                />
              </Grid>
            </Grid>
          </FormProvider>
        </Box>
      }
    />
  );
};

export default RefuseSubmissionModal;
