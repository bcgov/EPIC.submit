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

  const { submissionType, setSubmissionType } = useNewSubmissionStore();

  const packages = [
    {
      value: SubmissionPackageType.IPD,
      label: "Initial Project Description & Engagement Plan",
    },
    {
      value: SubmissionPackageType.ADDITIONAL_INFORMATION,
      label: "Additional Information Submission",
    },
  ];

  const [errorText, setErrorText] = useState<string | null>(null);

  const handleContinue = () => {
    if (!submissionType) {
      setErrorText("Please select a submission.");
      return;
    }
    // Submit to api and navigate
  };

  const handleCancel = () => {
    navigate({ to: `/proponent/projects/${projectId}` });
  };

  useEffect(() => {
    setErrorText(null);
  }, [submissionType]);

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
              setSubmissionType(e.target.value as SubmissionPackageType)
            }
            value={submissionType || ""}
            error={!submissionType && Boolean(errorText)}
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
              <MenuItem key={pkg.value} value={pkg.value}>
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
