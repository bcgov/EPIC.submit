import { ProjectListSkeleton } from "@/components/registration/addProjects/ProjectsList";
import { Banner } from "@/components/registration/Banner";
import { GridContainer } from "@/components/registration/GridContainer";
import { PageLoader } from "@/components/Shared/PageLoader";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Caption2 } from "@/components/Shared/Typographies";
import WarningBox from "@/components/Shared/WarningBox";
import { useGetAccountProjectsByUserId } from "@/hooks/api/useProjects";
import { useAccount } from "@/store/accountStore";
import { Button, Grid, Link, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useEffect, useMemo, useState } from "react";
import { Else, If, Then } from "react-if";
import { ProjectCard } from "./ProjectCard";

function AddProjects() {
  const navigate = useNavigate();
  const { userId } = useAccount();

  const {
    data: accountProjects,
    isPending: isFetchingProjects,
    isError: isLoadingProjectsError,
  } = useGetAccountProjectsByUserId({
    userId,
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

  if (isFetchingProjects) {
    return <PageLoader />;
  }

  return (
    <>
      <Banner>{projects.length > 0 ? projects[0].proponent_name : ""}</Banner>
      <GridContainer yellowBar>
        <Grid item xs={12}>
          <Typography variant="h4" fontWeight={600}>
            Project Account
          </Typography>
        </Grid>

        <Grid item xs={12} mt={"30px"}>
          <Typography variant="body1">
            EPIC.submit currently supports the submission of Management Plans,
            Independent Environmental Monitor Terms of Engagement, and certain
            reports only.
          </Typography>
        </Grid>

        <Grid item xs={12} mt={"20px"}>
          <Typography variant="body1">
            If you have any questions about the type of documents you can submit
            on EPIC.submit, please contact{" "}
            <Link href="mailto:EAO.ManagementPlanSupport@gov.bc.ca">
              EAO.ManagementPlanSupport@gov.bc.ca
            </Link>
            .
          </Typography>
        </Grid>
        <Grid item xs={12} mt={"20px"}>
          <If condition={isFetchingProjects}>
            <Then>
              <ProjectListSkeleton />
            </Then>
            <Else>
              <ProjectCard project={projects[0]} />
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
