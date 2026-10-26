import { PageGrid } from "@/components/Shared/PageGrid";
import { ContentBox } from "@/components/Shared/Layouts/ContentBox";
import { ContentBoxSkeleton } from "@/components/Shared/Layouts/ContentBox/ContentBoxSkeleton";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { LoadingButton as Button } from "@/components/Shared/LoadingButton";
import { SubmissionTitle } from "@/components/App/Submission/SubmissionTitle";
import { PROJECT_STATUS } from "@/components/Shared/ProjectStatus/constants";
import { ReportInfoBox } from "@/components/App/Projects/ReportDetail/ReportInfoBox";
import { ReportSubmissionsTable } from "@/components/App/Projects/ReportDetail/ReportSubmissionsTable";
import { getSubmissionPackageQueryOptions } from "@/hooks/api/usePackages";
import { getAccountProjectQueryOptions } from "@/hooks/api/useProjects";
import { formatReportPageTitle } from "@/components/App/Projects/ReportDetail/reportTitle";
import { canViewReportsSection } from "@/components/Shared/PermissionGate/utils";
import { useAccount } from "@/store/accountStore";
import { HTTP_STATUS } from "@/utils/constants";
import AddIcon from "@mui/icons-material/Add";
import { Box, Grid } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Navigate,
  notFound,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { isAxiosError } from "axios";

const ROUTE_ID =
  "/proponent/_proponentLayout/projects/$projectId/_projectLayout/reports/$reportPackageId/";

const PendingComponent = () => (
  <PageGrid>
    <Grid size={12}>
      <ContentBoxSkeleton />
    </Grid>
  </PageGrid>
);

export const Route = createFileRoute(ROUTE_ID)({
  component: ReportDetailPage,
  loader: ({ context: { queryClient }, params: { reportPackageId } }) =>
    queryClient.ensureQueryData(
      getSubmissionPackageQueryOptions({
        packageId: Number(reportPackageId),
      }),
    ),
  onError: (error) => {
    if (
      isAxiosError(error) &&
      error.response?.status === HTTP_STATUS.NOT_FOUND
    ) {
      throw notFound();
    }
    throw error;
  },
  pendingMs: 0,
  pendingComponent: PendingComponent,
  head: ({ loaderData: reportPackage, params }) => ({
    meta: [
      {
        title: formatReportPageTitle(reportPackage?.project_report),
        path: `/proponent/projects/${params.projectId}/reports/${params.reportPackageId}`,
      },
    ],
  }),
});

function ReportDetailPage() {
  const navigate = useNavigate();
  const { projectId: accountProjectIdParam, reportPackageId } = useParams({
    from: ROUTE_ID,
  });
  const accountProjectId = Number(accountProjectIdParam);

  const { userManagementRoles } = useAccount();
  const canAddDocument = canViewReportsSection(userManagementRoles);

  const { data: accountProject } = useSuspenseQuery(
    getAccountProjectQueryOptions(accountProjectId),
  );
  const { data: reportPackage } = useSuspenseQuery(
    getSubmissionPackageQueryOptions({ packageId: Number(reportPackageId) }),
  );

  if (!accountProject || !reportPackage || !reportPackage.project_report) {
    return <Navigate to="/error" />;
  }

  const report = reportPackage.project_report;
  const pageTitle = formatReportPageTitle(report);

  return (
    <PageGrid>
      <Grid size={12}>
        <ContentBox
          mainLabel={accountProject.project?.name}
          topLabel={accountProject.project?.proponent?.name || ""}
          bottomLabel={
            accountProject.project?.ea_certificate
              ? `EAC # ${accountProject.project.ea_certificate}`
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
            <SubmissionTitle
              sx={{ pb: BCDesignTokens.layoutPaddingSmall }}
              customTitle="Reports & Recurring Submissions"
              customStatus={PROJECT_STATUS.POST_DECISION}
            />
            <Box
              sx={{
                pt: BCDesignTokens.layoutPaddingSmall,
                pb: BCDesignTokens.layoutPaddingMedium,
                px: BCDesignTokens.layoutPaddingMedium,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: BCDesignTokens.layoutPaddingMedium,
                borderRadius: "4px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <BarTitle title={pageTitle} />
                {canAddDocument && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() =>
                      navigate({
                        to: "/proponent/projects/$projectId/reports/$reportPackageId/add-document",
                        params: {
                          projectId: accountProjectIdParam,
                          reportPackageId,
                        },
                      })
                    }
                  >
                    Add Document
                  </Button>
                )}
              </Box>
              <Box sx={{ width: "100%" }}>
                <ReportInfoBox report={report} />
              </Box>
              <Box sx={{ width: "100%" }}>
                <ReportSubmissionsTable reportPackage={reportPackage} />
              </Box>
              <Button
                color="secondary"
                onClick={() => navigate({ to: "/proponent/projects" })}
              >
                Save &amp; Close
              </Button>
            </Box>
          </Box>
        </ContentBox>
      </Grid>
    </PageGrid>
  );
}
