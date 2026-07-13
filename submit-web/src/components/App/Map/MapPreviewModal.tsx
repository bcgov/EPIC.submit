import React, { useEffect, useRef, useState } from "react";
import Map, {
  NavigationControl,
  Source,
  Layer,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getJsonObject } from "@/hooks/api/useObjectStorage";
import { useGetGeoUploadUrl, GeoUploadUrlResponse } from "@/hooks/api/useGeo";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  Divider,
  Fade,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import SatelliteIcon from "@mui/icons-material/Satellite";
import MapIcon from "@mui/icons-material/Map";
import type { GeoJSON } from "geojson";
import { Submission } from "@/models/Submission";
import { BCDesignTokens } from "epic.theme";
import { useHasRole } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

interface MapPreviewModalProps {
  open: boolean;
  uploadId: number | null;
  documentItem: Submission | null;
  fileSizeKb?: number;
  status?: string;
  errorMessage?: string;
  onApprove?: () => void;
  onReject?: () => Promise<void>;
  onClose?: () => void;
  previewOnly?: boolean;
}

export const MapPreviewModal: React.FC<MapPreviewModalProps> = ({
  open,
  uploadId,
  documentItem,
  fileSizeKb,
  status,
  errorMessage,
  onApprove,
  onReject,
  onClose,
  previewOnly = false,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJSON | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [mapStyleUri, setMapStyleUri] = useState<string>(
    "https://tiles.openfreemap.org/styles/liberty",
  );
  const isStaff = useHasRole(EPIC_SUBMIT_ROLE.eao_view);

  const SATELLITE_STYLE: any = {
    version: 8,
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri",
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
      },
    ],
  };

  const {
    data,
    isFetching: metaLoading,
    error: metaError,
  } = useGetGeoUploadUrl(uploadId, {
    enabled: Boolean(uploadId) && status === "ready",
  });
  const metaData = data as GeoUploadUrlResponse | undefined;

  // Clear stale map state when switching between files
  useEffect(() => {
    setGeoJson(null);
    setError(null);
    setLoading(false);
  }, [uploadId]);

  // Fetch GeoJSON whenever metaData.url changes
  useEffect(() => {
    if (!metaData?.url) {
      setGeoJson(null);
      setError(null);
      return;
    }

    const fetchGeoJson = async () => {
      setLoading(true);
      setError(null);
      setGeoJson(null);

      try {
        const json = await getJsonObject(metaData.url);
        setGeoJson(json as GeoJSON);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load map data";
        // eslint-disable-next-line no-console
        console.error("Map Preview error:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoJson();
  }, [metaData?.url]);

  // Fly to the data's bounding box once both metadata and geoJson are fully loaded
  useEffect(() => {
    if (metaData?.bbox?.length === 4 && mapRef.current && geoJson) {
      const [minX, minY, maxX, maxY] = metaData.bbox;

      const isValid =
        [minX, minY, maxX, maxY].every(
          (coord) => typeof coord === "number" && Number.isFinite(coord),
        ) &&
        minY >= -90 &&
        minY <= 90 &&
        maxY >= -90 &&
        maxY <= 90;

      if (isValid) {
        mapRef.current.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          { padding: 60, duration: 600, maxZoom: 14 },
        );
      }
    }
  }, [metaData, geoJson]);

  const isProcessing = status === "processing" || (!uploadId && open);

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      keepMounted
      PaperProps={{
        sx: {
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          px: 2,
          py: 2,
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              color: BCDesignTokens.typographyColorPrimary,
            }}
          >
            Review Geospatial File
          </Typography>
        </DialogTitle>
      </Box>
      <Divider />
      <DialogContent
        sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}
      >
        {/* Processing state — shown while GeoUpload record is pending or status=processing */}
        {isProcessing ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 2,
              p: 4,
            }}
          >
            <CircularProgress size={48} />
            <Typography
              variant="subtitle1"
              fontWeight={600}
              color="primary.main"
            >
              Please wait while your file is being processed.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This should take no more than 30 seconds.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Info Card */}
            {documentItem && (
              <Box
                sx={{
                  backgroundColor: BCDesignTokens.themeBlue10,
                  borderRadius: "8px",
                  p: 2,
                }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      File Name:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        color={BCDesignTokens.themeBlue100}
                      >
                        {documentItem.submitted_document?.name}
                      </Typography>
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      File Size:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight={400}
                      >
                        {fileSizeKb !== undefined && fileSizeKb !== null
                          ? `${fileSizeKb.toFixed(1)} KB`
                          : "Unknown"}
                      </Typography>
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Uploaded By:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight={400}
                      >
                        {documentItem.submitted_by}
                      </Typography>
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Version:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight={400}
                      >
                        {documentItem.version}.0
                      </Typography>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Map Preview Container */}
            <Box
              sx={{
                backgroundColor: BCDesignTokens.themeBlue10,
                border: `1px solid ${BCDesignTokens.themeGray40}`,
                borderRadius: "8px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: "500px",
              }}
            >
              {/* Header of Map Card */}
              <Box sx={{ pt: 2, px: 2, pb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Map Preview
                </Typography>
              </Box>

              {/* Alert Banner */}
              {!isStaff && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Alert severity="warning" sx={{ borderRadius: "8px", backgroundColor: BCDesignTokens.supportSurfaceColorWarning }} icon={false} variant="outlined">
                    <Typography variant="body1" fontWeight={700}>Please verify this geospatial file</Typography>
                    Review the map preview and file information to ensure this is the correct data (correct location, using the BC Albers Projection).
                    You must manually approve or reject each file before proceeding.
                  </Alert>
                </Box>
              )}

              {/* Dynamic Map Container */}
              <Box
                sx={{ flex: 1, position: "relative", minHeight: "350px" }}
              >
                {(status === "failed" || status === "validation_failed") ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#FEF2F2",
                      height: "100%",
                      minHeight: "350px",
                      p: 4,
                      textAlign: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="h6" color="error.main" fontWeight={700}>
                      {status === "validation_failed"
                        ? "Attribute validation failed"
                        : "Preview not available for this file"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ maxWidth: "500px", color: BCDesignTokens.typographyColorPlaceholder }}
                    >
                      {status === "validation_failed"
                        ? "This file does not meet the required attribute standards. Please correct the issue and re-upload."
                        : "Geometry must be valid; no NULL geometry or self-intersecting polygons"}
                    </Typography>
                    {errorMessage && (
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{ maxWidth: "500px", mt: 1 }}
                      >
                        {errorMessage}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Map
                    ref={mapRef}
                    mapStyle={
                      mapStyleUri === "satellite" ? SATELLITE_STYLE : mapStyleUri
                    }
                    initialViewState={{
                      longitude: -122.5,
                      latitude: 54.5,
                      zoom: 4,
                    }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        boxShadow: 1,
                      }}
                    >
                      <ToggleButtonGroup
                        value={mapStyleUri}
                        exclusive
                        onChange={(_, newStyle) => {
                          if (newStyle) setMapStyleUri(newStyle);
                        }}
                        size="small"
                      >
                        <ToggleButton
                          value="https://tiles.openfreemap.org/styles/liberty"
                          aria-label="street map"
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          <MapIcon sx={{ mr: 1, fontSize: 20 }} /> Street
                        </ToggleButton>
                        <ToggleButton
                          value="satellite"
                          aria-label="satellite map"
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          <SatelliteIcon sx={{ mr: 1, fontSize: 20 }} />{" "}
                          Satellite
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    <NavigationControl position="top-right" />

                    {/* Render GeoJSON layers once data is fetched */}
                    {geoJson && (
                      <Source
                        id="preview"
                        type="geojson"
                        data={geoJson}
                        tolerance={0}
                      >
                        {/* Filled polygons */}
                        <Layer
                          id="preview-fill"
                          type="fill"
                          source="preview"
                          filter={["==", ["geometry-type"], "Polygon"]}
                          paint={{
                            "fill-color": [
                              "coalesce",
                              ["get", "layer_color"],
                              "#3b82f6",
                            ],
                            "fill-opacity": 0.3,
                          }}
                        />
                        {/* Polygon and line outlines */}
                        <Layer
                          id="preview-line"
                          type="line"
                          source="preview"
                          filter={[
                            "any",
                            ["==", ["geometry-type"], "Polygon"],
                            ["==", ["geometry-type"], "MultiPolygon"],
                            ["==", ["geometry-type"], "LineString"],
                            ["==", ["geometry-type"], "MultiLineString"],
                          ]}
                          paint={{
                            "line-color": [
                              "coalesce",
                              ["get", "stroke_color"],
                              "#1d4ed8",
                            ],
                            "line-width": 1.5,
                          }}
                        />
                        {/* Point features */}
                        <Layer
                          id="preview-circle"
                          type="circle"
                          source="preview"
                          filter={["==", ["geometry-type"], "Point"]}
                          paint={{
                            "circle-radius": 5,
                            "circle-color": [
                              "coalesce",
                              ["get", "layer_color"],
                              "#3b82f6",
                            ],
                            "circle-stroke-width": 1.5,
                            "circle-stroke-color": [
                              "coalesce",
                              ["get", "stroke_color"],
                              "#1d4ed8",
                            ],
                          }}
                        />
                      </Source>
                    )}
                  </Map>
                )}

                {/* Loading Overlay — only for GeoJSON fetching, not processing state */}
                <Fade in={(loading || metaLoading) && !isProcessing}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 10,
                    }}
                  >
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      Fetching geospatial data...
                    </Typography>
                  </Box>
                </Fade>

                {/* Error Message */}
                {status !== "failed" && status !== "validation_failed" && (error || metaError) && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      bgcolor: "error.light",
                      color: "error.contrastText",
                      p: 3,
                      borderRadius: 2,
                      boxShadow: 3,
                      textAlign: "center",
                      zIndex: 11,
                      maxWidth: "80%",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                      Map Load Error
                    </Typography>
                    <Typography variant="body2">
                      {error ||
                        (metaError as Error)?.message ||
                        "Failed to load"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        {previewOnly ? (
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ minWidth: "120px" }}
          >
            Close
          </Button>
        ) : (
          <>
            <LoadingButton
              color="secondary"
              onClick={handleReject}
              loading={isRejecting}
              disabled={isProcessing}
              sx={{ minWidth: "120px" }}
            >
              Reject
            </LoadingButton>
            <Button
              variant="contained"
              onClick={onApprove}
              disabled={isProcessing || status === "failed" || status === "validation_failed"}
              sx={{ minWidth: "120px" }}
            >
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
