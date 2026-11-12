import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useFormContext } from "react-hook-form";
import ControlledDatePicker from "@/components/Shared/ControlledFormFields/ControlledDatePicker";
import { DateReceivedForm } from "./dateReceived";
import { DATE_RECEIVED_HELP_TEXT, DATE_RECEIVED_LABEL } from "../reportUpload";

const FIELD_ID = "date-received";
const HELP_ID = "date-received-help";

/**
 * Required "Date Received" field above the upload sections on the EAO
 * add-document page. One date applies to every file added at once. Must be
 * rendered inside a react-hook-form FormProvider with a `receivedDate` field.
 */
export const DateReceivedField = () => {
  const { clearErrors } = useFormContext<DateReceivedForm>();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography
        component="label"
        htmlFor={FIELD_ID}
        variant="body1"
        sx={{ fontWeight: "bold" }}
      >
        {DATE_RECEIVED_LABEL}
      </Typography>
      <Typography
        id={HELP_ID}
        variant="body2"
        sx={{ color: BCDesignTokens.typographyColorPrimary }}
      >
        {DATE_RECEIVED_HELP_TEXT}
      </Typography>
      <ControlledDatePicker
        name="receivedDate"
        disableFuture
        onChange={() => clearErrors("receivedDate")}
        slotProps={{
          textField: {
            id: FIELD_ID,
            size: "small",
            required: true,
            "aria-describedby": HELP_ID,
          },
        }}
      />
    </Box>
  );
};
