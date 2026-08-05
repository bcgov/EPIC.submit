import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { useProponentStore } from "@/store/proponentStore";
import { InfoOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProjectsTable } from "./ProjectsTable";

export const EligibleProjectsTable = () => {
  const proponent = useProponentStore((state) => state.proponent);

  const pendingInvitation = useProponentStore((state) => state.pendingInvitation);
  const pendingEntryIds = useProponentStore((state) => state.pendingEntryIds);
  const isLoading = useProponentStore((state) => state.isLoading);
  const isError = useProponentStore((state) => state.isError);
  const eligibleEntries = useProponentStore((state) => state.eligibleEntries);


  const hasEligibleItems = eligibleEntries.length > 0;

  return (
    <>
      <BarBlueTitle
        title="Eligible Project(s)/Work(s)"
        bold={false}
        variant="h5"
        tooltip={
          <Tooltip
            title="Project(s)/Work(s) for this Proponent/Holder will be added to this list as they become eligible to submit in EPIC.submit and can be added manually once the Proponent/Holder created their account."
            arrow
          >
            <IconButton sx={{ p: 0, ml: 1, mb: 0.5 }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      {proponent?.status == "ONBOARDED" && hasEligibleItems && (
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            whiteSpace: "pre-line",
            mt: BCDesignTokens.layoutMarginMedium
          }}
        >
          {`Select the Eligible Project(s)/Work(s) you want to enable for ${proponent?.name} and click the "Enable in EPIC.submit" button.
          
          The Account Administrator(s) for ${proponent?.name} will receive an email to inform them they can now access and submit documents for this project.`}
        </Typography>
      )}
      {proponent?.status == "INELIGIBLE" || !hasEligibleItems ? (
        <Box
          sx={{
            mt: BCDesignTokens.layoutMarginXlarge,
            border: 1,
            borderColor: BCDesignTokens.surfaceColorBorderDefault,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              lineHeight: BCDesignTokens.typographyLineHeightsRegular,
              px: BCDesignTokens.layoutPaddingSmall,
            }}
          >
            No other Project/Work for this Proponent/Holder is currently
            eligible to be onboarded in EPIC.submit
          </Typography>
        </Box>
      ) : (
        <ProjectsTable
          entries={eligibleEntries}
          pendingEntryIds={pendingEntryIds}
          readonly={!!pendingInvitation}
          isLoading={isLoading}
          isError={isError}
          sx={{
            mt: BCDesignTokens.layoutMarginLarge,
          }}
        />
      )}
    </>
  );
};
