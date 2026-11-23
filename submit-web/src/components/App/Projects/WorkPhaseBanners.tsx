import WarningBox from "@/components/Shared/Layouts/WarningBox";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";

type WorkPhaseBannersProps = {
  /** Name of the phase the work has not reached yet; the yellow banner shows when it is set. */
  awaitingPhaseName?: string | null;
  /** True once a previous phase's packages have been archived; the blue banner shows then. */
  hasArchivedPackages?: boolean;
  isStaff?: boolean;
};

export const WorkPhaseBanners = ({
  awaitingPhaseName,
  hasArchivedPackages = false,
  isStaff = false,
}: WorkPhaseBannersProps) => {
  if (!awaitingPhaseName && !hasArchivedPackages) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: BCDesignTokens.layoutMarginSmall,
        mb: BCDesignTokens.layoutMarginMedium,
      }}
    >
      {awaitingPhaseName && (
        <WarningBox
          data-testid="awaiting-phase-banner"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: BCDesignTokens.layoutMarginSmall,
            border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
            borderRadius: "4px",
            py: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <WarningAmberOutlinedIcon
            fontSize="small"
            htmlColor={BCDesignTokens.supportBorderColorWarning}
          />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Your project is not in {awaitingPhaseName} yet.
          </Typography>
        </WarningBox>
      )}
      {hasArchivedPackages && (
        <Box
          data-testid="archived-documents-banner"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: BCDesignTokens.layoutMarginSmall,
            border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
            backgroundColor: BCDesignTokens.supportSurfaceColorInfo,
            borderRadius: "4px",
            px: BCDesignTokens.layoutPaddingMedium,
            py: BCDesignTokens.layoutPaddingSmall,
          }}
        >
          <InfoOutlinedIcon
            fontSize="small"
            htmlColor={BCDesignTokens.supportBorderColorInfo}
          />
          <Typography variant="body2">
            {isStaff
              ? "Documents submitted for previous phases are now in the "
              : "Documents you submitted for previous phases are now in the "}
            <Link
              to={isStaff ? "/staff/documents" : "/proponent/documents"}
              style={{ color: BCDesignTokens.typographyColorLink }}
            >
              Documents tab
            </Link>
            .
          </Typography>
        </Box>
      )}
    </Box>
  );
};
