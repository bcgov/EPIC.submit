import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";
import { SubmissionPackageType } from "@/models/Package";

export const NewAssessmentSubmissionForm = () => {
  const { projectId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/new-submission",
  });
  const navigate = useNavigate();

  const {
    submissionPackageType,
    setSubmissionPackageType,
    mappedPackages,
    existingIPD,
  } = useNewSubmissionStore();

  const [errorText, setErrorText] = useState<string | null>(null);

  const packages = [
    ...(!existingIPD
      ? [
          {
            value: SubmissionPackageType.IPD,
            label: "Initial Project Description & Engagement Plan",
            id: null,
          },
        ]
      : []),
    ...mappedPackages,
    {
      value: SubmissionPackageType.ADDITIONAL_INFORMATION,
      label: "Additional Information Submission",
      id: null,
    },
  ];

  const handleContinue = () => {
    if (!submissionPackageType) {
      setErrorText("Please select a submission.");
      return;
    }

    const selectedPackage = packages.find(
      (pkg) => pkg.value === submissionPackageType,
    );
    if (selectedPackage?.id) {
      navigate({
        to: `/proponent/projects/${projectId}/submission-packages/${selectedPackage.id}`,
      });
      return;
    }
    // TODO: Navigate to Additional Information Submission form (SUBMIT-761 & SUBMIT-762)
  };

  const handleCancel = () => {
    navigate({ to: `/proponent/projects/${projectId}` });
  };

  useEffect(() => {
    setErrorText(null);
  }, [submissionPackageType]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Grid container sx={{ marginTop: "32px" }}>
        <Grid item xs={12}>
          <Typography variant="body1" fontWeight={"bold"}>
            What are you submitting?
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} lg={12}>
          <TextField
            select
            fullWidth
            sx={{ marginBottom: "10px", minWidth: "400px" }}
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
          <Grid item xs={12} mb={"15px"}>
            <Typography color="error" variant="body2">
              {errorText}
            </Typography>
          </Grid>
        )}
      </Grid>
      <Grid container spacing={2} mt="5em">
        <Grid item>
          <Button onClick={handleContinue}>Continue</Button>
        </Grid>
        <Grid item>
          <Button variant="text" onClick={handleCancel}>
            Cancel
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
