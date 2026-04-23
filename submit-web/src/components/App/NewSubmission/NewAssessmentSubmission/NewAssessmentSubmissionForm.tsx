import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";
import { SubmissionPackageType } from "@/models/Package";
import { AdditionalInformationForm } from "./AdditionalInformationForm";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useGetPackageTypesByPhaseId } from "@/hooks/api/usePackageTypes";

const additionalInfoSchema = yup.object().shape({
  name: yup.string().required("Please enter the name of your submission"),
  description: yup.string().required("Please enter a description of your submission"),
});

type AdditionalInfoForm = yup.InferType<typeof additionalInfoSchema>;

type NewAssessmentSubmissionFormProps = {
  onSubmit: (data: any) => void;
};

export const NewAssessmentSubmissionForm = ({
  onSubmit,
}: NewAssessmentSubmissionFormProps) => {
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });
  const navigate = useNavigate();

  const {
    submissionPackageType,
    setSubmissionPackageType,
    mappedPackages,
    accountProject,
    currentPhase,
  } = useNewSubmissionStore();

  // Fetch package types for the current phase
  const { data: package_types = [] } = useGetPackageTypesByPhaseId({
    phaseId: currentPhase?.id,
    enabled: Boolean(currentPhase?.id),
  });

  const [errorText, setErrorText] = useState<string | null>(null);
  const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);

  const methods = useForm<AdditionalInfoForm>({
    resolver: yupResolver(additionalInfoSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { handleSubmit, reset } = methods;

  // Map package types from API to dropdown options
  const packages = useMemo(() => {
    return package_types.map((pkgType) => {
      // Check if this package type already exists in mappedPackages
      const existingPackage = mappedPackages.find(
        (pkg) => pkg.value === pkgType.name
      );
      
      return {
        value: pkgType.name as SubmissionPackageType,
        label: pkgType.title || pkgType.name,
        id: existingPackage?.id || null,
      };
    });
  }, [package_types, mappedPackages]);

  const onSubmitAdditionalInfo = (data: AdditionalInfoForm) => {
    // Get the account_project_work_id from the current phase's work
    const accountProjectWorkId = 
      accountProject?.account_project_works?.find(
        (apw) => apw.work?.current_phase?.id === currentPhase?.id
      )?.id;

    // Create new package via API
    onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: SubmissionPackageType.ADDITIONAL_INFORMATION,
      account_project_work_id: accountProjectWorkId,
    });
  };

  const handleContinue = () => {
    // If showing Additional Information form, trigger form validation and submit
    if (showAdditionalInfoForm) {
      handleSubmit(onSubmitAdditionalInfo)();
      return;
    }

    // Handle package selection
    if (!submissionPackageType) {
      setErrorText("Please select a submission.");
      return;
    }

    const selectedPackage = packages.find(
      (pkg) => pkg.value === submissionPackageType,
    );
    
    // If package already exists, navigate to it
    if (selectedPackage?.id) {
      navigate({
        to: `/proponent/projects/${projectId}/submission-packages/${selectedPackage.id}`,
      });
      return;
    }

    // If it's Additional Information, show the form
    if (submissionPackageType === SubmissionPackageType.ADDITIONAL_INFORMATION) {
      // Form will be shown by useEffect
      return;
    }

    // For new package types, create the package
    const selectedPackageType = package_types.find(
      (pkgType) => pkgType.name === submissionPackageType
    );

    if (selectedPackageType) {
      // Get the account_project_work_id from the current phase's work
      const accountProjectWorkId = 
        accountProject?.account_project_works?.find(
          (apw) => apw.work?.current_phase?.id === currentPhase?.id
        )?.id;

      // Create new package via API
      onSubmit({
        name: selectedPackageType.title || selectedPackageType.name,
        description: undefined,
        type: selectedPackageType.name,
        account_project_work_id: accountProjectWorkId,
      });
    }
  };


  const handleCancel = () => {
    if (showAdditionalInfoForm) {
      // Go back to package selection
      setShowAdditionalInfoForm(false);
      setSubmissionPackageType(null);
      reset();
      return;
    }
    navigate({ to: `/proponent/projects/${projectId}` });
  };

  useEffect(() => {
    setErrorText(null);
    // Show Additional Information form immediately when selected
    if (submissionPackageType === SubmissionPackageType.ADDITIONAL_INFORMATION) {
      setShowAdditionalInfoForm(true);
    } else {
      setShowAdditionalInfoForm(false);
    }
  }, [submissionPackageType]);

  return (
    <>
      <Grid container spacing={2} sx={{ marginTop: "32px" }}>
        <Grid item xs={12}>
          <Typography variant="body1" fontWeight={"bold"}>
            What are you submitting?
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            onChange={(e) =>
              setSubmissionPackageType(e.target.value as SubmissionPackageType)
            }
            value={submissionPackageType || ""}
            error={!submissionPackageType && Boolean(errorText)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) =>
                value ? (
                  packages.find((pkg) => pkg.value === value)?.label
                ) : (
                  <span style={{ color: "grey" }}>Select a submission...</span>
                ),
            }}
          >
            {packages.map((pkg) => (
              <MenuItem key={`${pkg.value}-${pkg.id}`} value={pkg.value}>
                {pkg.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {errorText && (
          <Grid item xs={12}>
            <Typography color="error" variant="body2">
              {errorText}
            </Typography>
          </Grid>
        )}

        {showAdditionalInfoForm && (
          <Grid item xs={12}>
            <FormProvider {...methods}>
              <AdditionalInformationForm />
            </FormProvider>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={2} mt="5em">
        <Grid item>
          <Button variant="text" onClick={handleCancel}>
            Cancel
          </Button>
        </Grid>
        <Grid item>
          <Button onClick={handleContinue}>Continue</Button>
        </Grid>
      </Grid>
      </>
  );
};
