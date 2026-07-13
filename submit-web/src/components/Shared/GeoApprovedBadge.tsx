import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { Tooltip } from "@mui/material";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";

type GeoApprovedBadgeProps = Readonly<{
  itemId?: number;
  url?: string;
  folder?: string;
}>;

/**
 * Small green check badge shown next to a geospatial file's name once the
 * proponent has approved it. Renders nothing for non-geospatial files or files
 * that are not yet approved. Fetches geo uploads by item; React Query dedupes
 * the request across rows of the same item.
 */
export const GeoApprovedBadge = ({ itemId, url, folder }: GeoApprovedBadgeProps) => {
  const isGeoSpatial = folder === S3_FOLDER.GEOSPATIAL.value;

  const { data: geoUploads } = useGetGeoUploads(
    { itemId },
    { enabled: isGeoSpatial && Boolean(itemId) },
  );

  if (!isGeoSpatial) return null;

  const upload = (geoUploads as GeoUpload[] | undefined)?.find(
    (u) => u.raw_s3_key === url,
  );
  if (!upload?.is_approved) return null;

  return (
    <Tooltip title="Approved">
      <CheckCircleOutlinedIcon
        color="success"
        aria-label="Approved"
        sx={{ fontSize: 18, flexShrink: 0 }}
      />
    </Tooltip>
  );
};

export default GeoApprovedBadge;
