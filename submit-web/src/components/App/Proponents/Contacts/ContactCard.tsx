import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProponentAdministrator } from "@/models/Proponent";

type ContactCardProps = {
  administrator: ProponentAdministrator;
  entityName: string;
  index: number;
};

export const ContactCard = ({
  administrator,
  entityName,
  index,
}: ContactCardProps) => {

  return (
    <Box
      sx={{
        border: 1,
        borderColor: BCDesignTokens.surfaceColorBorderDefault,
        p: BCDesignTokens.layoutPaddingMedium,
        flex: 1,
        minHeight: 0,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: BCDesignTokens.layoutMarginSmall,
        }}
      >
        {`${entityName} Regulated Party Account Administrator ${index + 1}`}
      </Typography>

      <Typography variant="body1" sx={{ fontWeight: 700 }}>
        {administrator.full_name}
      </Typography>
      {administrator.company_name && (
        <Typography variant="body1">{administrator.company_name}</Typography>
      )}
      <Typography variant="body1">{administrator.position}</Typography>
      <Typography variant="body1">{administrator.work_contact_number}</Typography>
      <Typography variant="body1">
        <Link
          href={`mailto:${administrator.work_email_address}`}
          underline="hover"
        >
          {administrator.work_email_address}
        </Link>
      </Typography>
    </Box>
  );
};

