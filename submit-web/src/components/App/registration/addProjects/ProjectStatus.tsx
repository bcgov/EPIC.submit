import { Caption2 } from "@/components/Shared/Typographies";
import { Case, Default, Switch } from "react-if";
import ModeStandbyIcon from "@mui/icons-material/ModeStandby";
import { Stack } from "@mui/material";
import { PROJECT_STATUS } from "./ProjectCard/constants";
import { EAOColors } from "epic.theme";

type ProjectStatusProps = {
  status: string;
};
export const ProjectStatus = ({ status }: ProjectStatusProps) => {
  return (
    <Switch>
      <Case condition={status === PROJECT_STATUS.POST_DECISION}>
        <Stack
          spacing={1}
          direction="row"
          alignItems={"center"}
          color={EAOColors.DecisionDark}
        >
          <ModeStandbyIcon />
          <Caption2 color={EAOColors.DecisionDark} bold>
            Post-Decision
          </Caption2>
        </Stack>
      </Case>
      <Default>
        <Caption2>{status}</Caption2>
      </Default>
    </Switch>
  );
};
