import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { ContentBox } from "@/components/Shared/ContentBox";
import { YellowBar } from "@/components/Shared/YellowBar";
import ItemsTable from "@/components/Submission/ItemsTable";
import { Box, Grid, Typography } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { PageGrid } from "@/components/Shared/PageGrid";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { InfoBox } from "@/components/Submission/InfoBox";
import {
  useGetSubmissionPackage,
  useUpdateStateSubmissionPackage,
} from "@/hooks/api/usePackages";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { useEffect } from "react";
import { PACKAGE_STATUS } from "@/models/Package";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { SuccessBox } from "@/components/Submission/SuccessBox";
import { When } from "react-if";
import { PackageStatusChipStack } from "@/components/PackageStatusChip/PackageStatusChipStack";
import { usePackageTableStore } from "@/components/Submission/packageTableStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/",
)({
  component: SubmissionPage,
});

export default function SubmissionPage() {
  const { setIsValidating, reset } = usePackageTableStore();
  const { projectId: accountProjectIdParam } = useParams({ strict: false });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });
  const { submissionPackageId: submissionPackageIdParam } = useParams({
    strict: false,
  });
  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage } = useGetSubmissionPackage({
    packageId: submissionPackageId,
    enabled: Boolean(accountProject?.id),
  });

  const {
    mutate: updateStateSubmissionPackage,
    isPending: isSubmittingPackage,
  } = useUpdateStateSubmissionPackage({
    onError: () => {
      notify.error("Failed to submit management plan");
    },
  });

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPackage = () => {
    if (!submissionPackage) {
      return;
    }

    if (
      submissionPackage.items.some(
        (item) => item.status !== SUBMISSION_STATUS.COMPLETED.value,
      )
    ) {
      setIsValidating(true);
      return;
    }

    updateStateSubmissionPackage({
      packageId: submissionPackage.id,
      data: {
        status: PACKAGE_STATUS.SUBMITTED.value,
      },
    });
  };

  if (!accountProject || !submissionPackage) {
    return <Navigate to={"/error"} />;
  }

  const isPackageSubmitted = submissionPackage.status.includes(
    PACKAGE_STATUS.SUBMITTED.value,
  );

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ContentBox
          mainLabel={accountProject?.project?.name}
          label={
            accountProject?.project?.ea_certificate
              ? `EAC #${accountProject?.project?.ea_certificate}`
              : ""
          }
        >
          <Box
            sx={{
              padding: BCDesignTokens.layoutPaddingMedium,
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            <Box sx={{ pb: BCDesignTokens.layoutPaddingSmall }}>
              <Typography variant="h4" fontWeight={400}>
                Management Plans
              </Typography>
              <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
            </Box>
            <Box
              sx={{
                pt: BCDesignTokens.layoutPaddingSmall,
                pb: BCDesignTokens.layoutPaddingMedium,
                px: BCDesignTokens.layoutPaddingMedium,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              }}
            >
              <YellowBar />
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: BCDesignTokens.layoutMarginXlarge,
                }}
              >
                <Typography variant="h5">{submissionPackage?.name}</Typography>
                <Box flexDirection={"row"} sx={{ display: "flex" }}>
                  <Typography
                    color={BCDesignTokens.themeGray70}
                    fontWeight={900}
                    sx={{ mr: BCDesignTokens.layoutMarginMedium }}
                  >
                    Submission Status:
                  </Typography>
                  <PackageStatusChipStack status={submissionPackage.status} />
                </Box>
              </Box>
              <InfoBox submissionPackage={submissionPackage} />
              <Box
                sx={{
                  mb: BCDesignTokens.layoutMarginXlarge,
                  pt: BCDesignTokens.layoutPaddingSmall,
                }}
              >
                <ItemsTable submissionItems={submissionPackage.items} />
              </Box>
              <When condition={isPackageSubmitted}>
                <Box mb={BCDesignTokens.layoutMarginXlarge}>
                  <SuccessBox submissionPackageType={submissionPackage.type} />
                </Box>
              </When>
              <Box
                sx={{
                  pt: BCDesignTokens.layoutPaddingXlarge,
                }}
              >
                <Button
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() =>
                    navigate({ to: `/projects/${accountProject.id}` })
                  }
                >
                  Save & Close
                </Button>
                <Button
                  onClick={submitPackage}
                  loading={isSubmittingPackage}
                  disabled={isPackageSubmitted}
                >
                  Submit Management Plan
                </Button>
              </Box>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
