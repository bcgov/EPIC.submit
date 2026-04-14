import { Box, Typography, Divider } from "@mui/material";
import { ProjectStatus } from "@/components/App/registration/addProjects/ProjectStatus";
import { getProjectStatus } from "@/components/App/registration/addProjects/ProjectCard/constants";
import { BCDesignTokens } from "epic.theme";
import { Project } from "@/models/Project";

type ProjectCardProps = {
  project: Project;
};

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const work = project.works?.at(-1)?.current_phase?.work_type_name;
  const phase = project.works?.at(-1)?.current_phase?.name;
  const status = phase ? getProjectStatus(phase) : undefined;

  return (
    <Box
      sx={{
        border: `4px solid ${BCDesignTokens.themePrimaryGold}`,
        borderRadius: BCDesignTokens.layoutBorderRadiusLarge,
        padding: 0,
        display: "inline-block",
        boxShadow:
          "0 0.6px 1.8px 0 rgba(0, 0, 0, 0.10), 0 3.2px 7.2px 0 rgba(0, 0, 0, 0.13)",
        minWidth: 360,
        maxWidth: 420,
      }}
    >
      <Box
        sx={{
          padding: "12px 24px",
          borderTopLeftRadius: BCDesignTokens.layoutBorderRadiusMedium,
          borderTopRightRadius: BCDesignTokens.layoutBorderRadiusMedium,
          background: BCDesignTokens.themeBlue10,
        }}
      >
        <Typography variant="h6">{project.name}</Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          pt: 4.5,
          borderBottomLeftRadius: BCDesignTokens.layoutBorderRadiusMedium,
          borderBottomRightRadius: BCDesignTokens.layoutBorderRadiusMedium,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 0px 6px 1px rgba(0, 0, 0, 0.10)",
          }}
        >
          <Typography variant="h4" fontWeight={400} px={1.5} py={1}>
            {work}
          </Typography>
          {status && <ProjectStatus status={status} />}
          <Divider sx={{ borderColor: BCDesignTokens.themeGray40 }} />
          <Typography variant="body1" px={1.5} py={1.5}>
            Submit your Initial Project Description &amp; Engagement Plan, and
            any other additional documents for the Early Engagement Phase.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
