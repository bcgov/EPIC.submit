import { Caption2 } from "@/components/Shared/Typographies";
import ModeStandbyIcon from "@mui/icons-material/ModeStandby";
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

const DEFAULT_STYLE: StyleProps = {
  color: "#5583B5",
  label: "",
};

type ProjectStatusProps = {
  status: string;
};
export const ProjectStatus = ({ status }: ProjectStatusProps) => {
  if (!status) {
    return null;
  }

  // Use predefined style if available, otherwise use default with the status as label
  const style = statusStyles[status] || {
    ...DEFAULT_STYLE,
    label: status,
  };

  return (
    <Stack
      spacing={1}
      direction="row"
      alignItems={"center"}
      color={style.color}
    >
      <ModeStandbyIcon />
      <Caption2 color={style.color} bold>
        {style.label}
      </Caption2>
    </Stack>
  );
};
