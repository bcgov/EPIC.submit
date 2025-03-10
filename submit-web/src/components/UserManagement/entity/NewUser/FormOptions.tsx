import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { IconButton, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";

type FormOptionsProps = {
  error: boolean;
  disabled?: boolean;
};

export enum Role {
  PROJECT_ADMIN = "PROJECT_ADMIN",
  SUBMISSION_ADMIN = "SUBMISSION_ADMIN",
  SPECIFIC_SUBMISSION_CONTRIBUTOR = "SPECIFIC_SUBMISSION_CONTRIBUTOR",
}

const roleDetails: Record<Role, { label: string; info: string }> = {
  [Role.PROJECT_ADMIN]: {
    label: "Project Administrator",
    info: "Full access to all submissions (including creating new submissions and submitting to EAO), manage users, and system settings.",
  },
  [Role.SUBMISSION_ADMIN]: {
    label: "Collaborator - All Submissions",
    info: "Access all existing submissions to view and contribute.",
  },
  [Role.SPECIFIC_SUBMISSION_CONTRIBUTOR]: {
    label: "Collaborator - Specific Submissions",
    info: "Access is limited to specific submissions to view and contribute.",
  },
};

export const FormOptions = ({
  error = true,
  disabled = false,
}: FormOptionsProps) => {
  return (
    <>
      {Object.entries(roleDetails).map(([role, { label, info }]) => (
        <div key={role} style={{ display: "flex", alignItems: "center" }}>
          <SubmitRadio
            value={role}
            label={label}
            error={error}
            disabled={disabled}
          />
          <Tooltip title={info} arrow>
            <IconButton sx={{ p: 0, ml: -1 }}>
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ))}
    </>
  );
};
