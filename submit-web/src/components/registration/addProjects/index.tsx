import {
  ProjectListSkeleton,
  ProjectsList,
} from "@/components/registration/addProjects/ProjectsList";
import { Banner } from "@/components/registration/Banner";
import { GridContainer } from "@/components/registration/GridContainer";
import { PageLoader } from "@/components/Shared/PageLoader";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Caption2 } from "@/components/Shared/Typographies";
import WarningBox from "@/components/Shared/WarningBox";
import {
  useAddProjects,
  useLoadProjectsByProponentId,
} from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import {
  Button,
  CircularProgress,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useEffect, useState } from "react";
import { Else, If, Then } from "react-if";

function AddProjects() {
  const navigate = useNavigate();
  const { accountId, proponentId, isLoading: isAccountLoading } = useAccount();
  const {
    data: projects,
    isPending: isFetchingProjects,
    isError: isLoadingProjectsError,
  } = useLoadProjectsByProponentId(proponentId);

  useEffect(() => {
    if (isLoadingProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isLoadingProjectsError]);

  const [openWarning, setOpenWarning] = useState(false);

  const onAddProjectsSuccess = () => {
    navigate({ to: "/proponent/registration/complete" });
  };
  const onAddProjectsError = () => {
    notify.error("Failed to add projects");
  };
  const { mutate: addProjects, isPending: isAddingProjectsPending } =
    useAddProjects({
      onSuccess: onAddProjectsSuccess,
      onError: onAddProjectsError,
    });

  const onConfirmProjectsClick = () => {
    if (!projects) {
      return;
    }

    const projectIds = projects.map((project) => project.id);
    addProjects({ accountId, projectIds });
  };

  if (isAccountLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Banner>CGI Mines Inc.</Banner>
      <GridContainer>
        <Grid item xs={12}>
          <Typography variant="h4" fontWeight={600}>
            Project Account
          </Typography>
        </Grid>

        <Grid item xs={12} mt={"30px"}>
          <Typography variant="body1">
            EPIC.submit currently supports the submission of Management Plans
            only.
          </Typography>
        </Grid>

        <Grid item xs={12} mt={"20px"}>
          <Typography variant="body1">
            We found the following project(s) associated with CGI Mines Inc.
          </Typography>
        </Grid>
        <Grid item xs={12} mt={"20px"}>
          <If condition={isFetchingProjects}>
            <Then>
              <ProjectListSkeleton />
            </Then>
            <Else>
              <ProjectsList projects={projects} />
            </Else>
          </If>
        </Grid>

        <Stack
          direction="row"
          spacing={2}
          mt={"3em"}
          alignItems={"center"}
          mb={BCDesignTokens.layoutMarginLarge}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={onConfirmProjectsClick}
            disabled={!projects}
          >
            {isAddingProjectsPending ? (
              <CircularProgress />
            ) : (
              "Confirm Project(s)"
            )}
          </Button>
          <Caption2>
            <Link onClick={() => setOpenWarning(true)}>
              No, this is incorrect
            </Link>
          </Caption2>
        </Stack>
        {openWarning && (
          <Grid item xs={12}>
            <WarningBox>
              Please Contact the EAO at
              <Link
                href="mailto:EAO.ManagementPlanSupport@gov.bc.ca"
                sx={{ ml: BCDesignTokens.layoutMarginXsmall }}
              >
                EAO.ManagementPlanSupport@gov.bc.ca.
              </Link>
            </WarningBox>
          </Grid>
        )}
      </GridContainer>
    </>
  );
}

export default AddProjects;
