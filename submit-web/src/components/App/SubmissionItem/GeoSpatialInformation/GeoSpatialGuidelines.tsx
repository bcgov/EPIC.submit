import { Box, Link, List, ListItem, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BCDesignTokens } from "epic.theme";
import { GEO_DOC_LABELS, GEO_DOC_LINKS } from "./constants";

const StyledListItem = styled(ListItem)({
  padding: 2,
  display: "list-item",
  listStyleType: "disc",
  color: BCDesignTokens.themeBlue100,
});

export const GeoSpatialGuidelines = () => {
  return (
    <Box>
      <Typography variant="body2">
        Please download the EAO’s{" "}
        <Link
          href={GEO_DOC_LINKS[GEO_DOC_LABELS.SPATIAL_GUIDELINE]}
          underline="always"
          sx={{ color: BCDesignTokens.themeBlue100 }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Spacial Data Submission Guideline
        </Link>{" "}
        (PDF, 5.1MB) to understand GIS files requirements.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        You can also download these shape file templates to help you get
        started.
      </Typography>
      <List sx={{ pl: 4 }}>
        <StyledListItem>
          <Typography variant="body2">
            <Link
              href={GEO_DOC_LINKS[GEO_DOC_LABELS.EAOShapeFiles]}
              underline="always"
              sx={{ color: BCDesignTokens.themeBlue100 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              EAOShapeFiles
            </Link>
          </Typography>
        </StyledListItem>
        <StyledListItem>
          <Typography variant="body2">
            <Link
              href={GEO_DOC_LINKS[GEO_DOC_LABELS.EAO_ESRI_FileGDB]}
              underline="always"
              sx={{ color: BCDesignTokens.themeBlue100 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              EAO_ESRI_FileGDB
            </Link>{" "}
            (with domains - may be submitted as an alternative to
            individual shapefiles)
          </Typography>
        </StyledListItem>
        <StyledListItem>
          <Typography variant="body2">
            <Link
              href={GEO_DOC_LINKS[GEO_DOC_LABELS.EOA_QGISGeopackage]}
              underline="always"
              sx={{ color: BCDesignTokens.themeBlue100 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              EOA_QGISGeopackage
            </Link>{" "}
            (with domains)
          </Typography>
        </StyledListItem>
      </List>
    </Box>
  );
};
