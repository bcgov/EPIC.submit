import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { IconButton, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { roleDetails } from "@/models/Role";

type FormOptionsProps = {
  error: boolean;
  disabled?: boolean;
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
