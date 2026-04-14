import { Caption2 } from "@/components/Shared/Typographies";
import { ModeStandby } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { EAOColors } from "epic.theme";

type StyleProps = {
  color: string;
  label: string;
};

const statusStyles: Record<string, StyleProps> = {
  POST_DECISION: {
    color: EAOColors.DecisionDark,
    label: "Post-Decision",
  },
  EARLY_ENGAGEMENT: {
    color: "#5583B5",
    label: "Early Engagement",
  },
};

type ProjectStatusProps = {
  status: string;
};
export const ProjectStatus = ({ status }: ProjectStatusProps) => {
  const style = statusStyles[status];

  if (!style) {
    return null;
  }

  return (
    <Stack
      spacing={1}
      direction="row"
      alignItems={"center"}
      color={style.color}
    >
      <ModeStandby />
      <Caption2 color={style.color} bold>
        {style.label}
      </Caption2>
    </Stack>
  );
};
