import { useEffect, useState, useMemo } from "react";
import { Button, Grid, ListSubheader, MenuItem, TextField, Typography } from "@mui/material";
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
  description: yup.string().optional().nullable(),
});

type AdditionalInfoForm = yup.InferType<typeof additionalInfoSchema>;

type NewWorkPackageSubmissionFormProps = {
  onSubmit: (data: any) => void;
};

export const NewWorkPackageSubmissionForm = ({
  onSubmit,
}: NewWorkPackageSubmissionFormProps) => {
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

  const [selectedPackageValue, setSelectedPackageValue] = useState<string>("");
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
  // Show existing packages (including mandatory ones) and available non-mandatory package types
  const packages = useMemo(() => {
    // Create a map of package type names to existing packages (can have multiple per type)
    const existingPackagesByType = new Map<string, typeof mappedPackages>();
    mappedPackages.forEach((pkg) => {
      const existing = existingPackagesByType.get(pkg.value) || [];
      existingPackagesByType.set(pkg.value, [...existing, pkg]);
    });

    const packageOptions: Array<{
      value: string;
      packageType: SubmissionPackageType;
      label: string;
      id: number | null;
      isExisting: boolean;
      sortOrder: number;
    }> = [];

    // Build list from package types
    package_types.forEach((pkgType) => {
      const existingPackages = existingPackagesByType.get(pkgType.name) || [];

      // If mandatory and doesn't exist, skip it (can't be created from UI)
      if (pkgType.mandatory && existingPackages.length === 0) {
        return;
      }

      // Sort existing packages alphabetically by label
      const sortedExistingPackages = [...existingPackages].sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      // Add existing packages first
      sortedExistingPackages.forEach((existingPkg) => {
        const packageTypeTitle = pkgType.title || pkgType.name;
        const customPackageName = existingPkg.label;
        // Show "Type Title - Custom Name" if they differ, otherwise just the name
        const displayLabel = packageTypeTitle !== customPackageName
          ? `${packageTypeTitle} - ${customPackageName}`
          : customPackageName;

        packageOptions.push({
          value: `existing-${existingPkg.id}`,
          packageType: pkgType.name as SubmissionPackageType,
          label: displayLabel,
          id: existingPkg.id,
          isExisting: true,
          sortOrder: 0, // Existing packages come first
        });
      });

      // For non-mandatory types, add option to create new (after existing packages)
      if (!pkgType.mandatory) {
        packageOptions.push({
          value: `new-${pkgType.name}`,
          packageType: pkgType.name as SubmissionPackageType,
          label: pkgType.title || pkgType.name,
          id: null,
          isExisting: false,
          sortOrder: 1, // Creation options come after existing
        });
      }
    });

    // Sort by package type first, then by sortOrder (existing before new), then by label
    return packageOptions.sort((a, b) => {
      // First sort by package type
      const typeCompare = a.packageType.localeCompare(b.packageType);
      if (typeCompare !== 0) return typeCompare;
      
      // Then by sortOrder (existing packages before creation options)
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      
      // Finally by label
      return a.label.localeCompare(b.label);
    });
  }, [package_types, mappedPackages]);

  const onSubmitAdditionalInfo = (data: AdditionalInfoForm) => {
    // Get the account_project_work_id from the current phase's work
    const accountProjectWorkId = accountProject?.account_project_works?.find(
      (apw) => apw.work?.current_phase?.id === currentPhase?.id,
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
      (pkg) => pkg.value === selectedPackageValue,
    );

    // If package already exists, navigate to it
    if (selectedPackage?.id) {
      navigate({
        to: `/proponent/projects/${projectId}/submission-packages/${selectedPackage.id}`,
      });
      return;
    }

    // If it's Additional Information, show the form
    if (
      submissionPackageType === SubmissionPackageType.ADDITIONAL_INFORMATION
    ) {
      // Form will be shown by useEffect
      return;
    }

    // For new package types, create the package
    const selectedPackageType = package_types.find(
      (pkgType) => pkgType.name === submissionPackageType,
    );

    if (selectedPackageType) {
      // Get the account_project_work_id from the current phase's work
      const accountProjectWorkId = accountProject?.account_project_works?.find(
        (apw) => apw.work?.current_phase?.id === currentPhase?.id,
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
      setSelectedPackageValue("");
      reset();
      return;
    }
    navigate({ to: `/proponent/projects/${projectId}` });
  };

  useEffect(() => {
    setErrorText(null);
    const selectedPackage = packages.find(
      (pkg) => pkg.value === selectedPackageValue,
    );
    // Show Additional Information form immediately when selected for new packages
    if (
      submissionPackageType === SubmissionPackageType.ADDITIONAL_INFORMATION &&
      selectedPackage &&
      !selectedPackage.isExisting
    ) {
      setShowAdditionalInfoForm(true);
    } else {
      setShowAdditionalInfoForm(false);
    }
  }, [submissionPackageType, selectedPackageValue, packages]);

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
            onChange={(e) => {
              const value = e.target.value;
              setSelectedPackageValue(value);
              const selected = packages.find((pkg) => pkg.value === value);
              if (selected) {
                setSubmissionPackageType(selected.packageType);
              }
            }}
            value={selectedPackageValue}
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
            {/* New Submissions Section */}
            {packages.some((pkg) => !pkg.isExisting) && (
              <ListSubheader
                sx={{
                  fontFamily: 'BC Sans',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#898785',
                }}
              >
                Create a new submission
              </ListSubheader>
            )}
            {packages
              .filter((pkg) => !pkg.isExisting)
              .map((pkg) => (
                <MenuItem key={`${pkg.value}-${pkg.id}`} value={pkg.value} sx={{ pl: 4 }}>
                  • {pkg.label}
                </MenuItem>
              ))}

            {/* Existing Packages Section */}
            {packages.some((pkg) => pkg.isExisting) && (
              <ListSubheader
                sx={{
                  fontFamily: 'BC Sans',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#898785',
                }}
              >
                Add documents to existing submission
              </ListSubheader>
            )}
            {packages
              .filter((pkg) => pkg.isExisting)
              .map((pkg) => (
                <MenuItem key={`${pkg.value}-${pkg.id}`} value={pkg.value} sx={{ pl: 4 }}>
                  • {pkg.label}
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
