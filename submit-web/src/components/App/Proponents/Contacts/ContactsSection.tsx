import { Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProponentAdministrator } from "@/models/Proponent";
import { ContactCard } from "./ContactCard";

type ContactsSectionProps = {
  entityName?: string;
  administrators?: ProponentAdministrator[];
};

export const ContactsSection = ({
  entityName,
  administrators = [],
}: ContactsSectionProps) => {
  if (!entityName || administrators.length === 0) {
    return null;
  }

  return (
    <>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mt: BCDesignTokens.layoutMarginXxxlarge,
          mb: BCDesignTokens.layoutMarginMedium,
        }}
      >
        Contacts
      </Typography>
      <Grid container spacing={2}>
        {administrators.map((administrator, index) => (
          <Grid
            item
            xs={12}
            md={6}
            key={administrator.id ?? index}
            sx={{ display: "flex" }}
          >
            <ContactCard
              administrator={administrator}
              entityName={entityName}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

