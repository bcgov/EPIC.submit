import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { IconButton, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";

type FormOptionsProps = {
  error: boolean;
  disabled?: boolean;
};

export const FormOptions = ({
  error = true,
  disabled = false,
}: FormOptionsProps) => {
  const infoTexts = {
    Admin:
      "Full access to all submissions (including creating new submissions and submitting to EAO), manage users, and system settings.",
    Collaborator: "Access all existing submissions to view and contribute.",
    CollaboratorSpecific:
      "Access is limited to specific submissions to view and contribute.",
  };

  const roles = ["Admin", "Collaborator", "CollaboratorSpecific"] as const;

  return (
    <>
      {roles.map((role) => (
        <div key={role} style={{ display: "flex", alignItems: "center" }}>
          <SubmitRadio
            value={role}
            label={
              role === "Admin"
                ? "Project Administrator"
                : role === "Collaborator"
                  ? "Collaborator - All Submission"
                  : "Collaborator - Specific Submissions"
            }
            error={error}
            disabled={disabled}
          />
          <Tooltip title={infoTexts[role]} arrow>
            <IconButton sx={{ p: 0, ml: -1 }}>
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ))}
    </>
  );
};
