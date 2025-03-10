import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { IconButton, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

type FormOptionsProps = {
  error: boolean;
  disabled?: boolean;
};

const roleDetails: Record<
  USER_MANAGEMENT_ROLE,
  { label: string; info: string }
> = {
  [USER_MANAGEMENT_ROLE.PROJECT_ADMIN]: {
    label: "Project Administrator",
    info: "Full access to all submissions (including creating new submissions and submitting to EAO), manage users, and system settings.",
  },
  [USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN]: {
    label: "Collaborator - All Submissions",
    info: "Access all existing submissions to view and contribute.",
  },
  [USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR]: {
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
