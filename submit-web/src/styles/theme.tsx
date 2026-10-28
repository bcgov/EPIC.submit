import "@/styles/App.scss";
import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import { BCDesignTokens, createAppTheme } from "epic.theme";

const baseTheme = createAppTheme({});

// Picker fields use their own accessible components; preserve the shared theme while styling those slots.
export const theme = createTheme({
  ...baseTheme,
  components: {
    ...baseTheme.components,
    MuiPickersTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputLabel-root": {
            position: "static", transform: "none", fontSize: "0.875rem", lineHeight: "1.5rem",
            color: BCDesignTokens.typographyColorSecondary,
          },
          "& .MuiFormHelperText-root": { marginLeft: 0, fontSize: "0.875rem" },
        },
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: BCDesignTokens.surfaceColorFormsDefault,
          border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
          padding: "0 12px",
          "&:hover": { borderColor: BCDesignTokens.surfaceColorBorderDark },
          "&.Mui-focused": { borderColor: BCDesignTokens.surfaceColorBorderActive },
          "&.Mui-error": { borderColor: BCDesignTokens.typographyColorDanger },
          "&.Mui-disabled": { backgroundColor: BCDesignTokens.surfaceColorFormsDisabled },
        },
        notchedOutline: { display: "none" },
        sectionsContainer: { padding: "7px 0", minHeight: "24px" },
      },
    },
  },
});
