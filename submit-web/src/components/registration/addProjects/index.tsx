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
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { Button, Grid, Link, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useEffect, useMemo, useState } from "react";
import { Else, If, Then } from "react-if";

function AddProjects() {
  const navigate = useNavigate();
  const { isLoading: isAccountLoading, accountId } = useAccount();

  const {
    data: accountProjects,
    isPending: isFetchingProjects,
    isError: isLoadingProjectsError,
  } = useGetAccountProjectsByAccount({
    accountId,
  });

  const projects = useMemo(() => {
    if (!accountProjects) {
      return [];
    }

    return accountProjects.map((accountProject) => {
      return accountProject.project;
    });
  }, [accountProjects]);

  useEffect(() => {
    if (isLoadingProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isLoadingProjectsError]);

  const [openWarning, setOpenWarning] = useState(false);

  const onConfirmProjectsClick = () => {
    if (!accountProjects) {
      return;
    }

    navigate({ to: "/proponent/registration/complete" });
  };

  if (isAccountLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Banner>{projects[0].proponent_name}</Banner>
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
            Confirm Project(s)
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
