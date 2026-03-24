import React, { useEffect, useRef, useState } from "react";
import Map, {
  NavigationControl,
  Source,
  Layer,
  MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { submitRequest } from "@/utils/axiosUtils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { GeoJSON } from "geojson";

interface MapPreviewModalProps {
  uploadId: number | null;
  onClose: () => void;
}

interface MetaData {
  url: string;
  bbox: number[];
  feature_count: number;
  geometry_type: string;
  crs_original: string;
}

export const MapPreviewModal: React.FC<MapPreviewModalProps> = ({
  uploadId,
  onClose,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [geoJson, setGeoJson] = useState<GeoJSON | null>(null);

  // Reset state and fetch new GeoJSON whenever uploadId changes
  useEffect(() => {
    if (!uploadId) {
      setGeoJson(null);
      setMeta(null);
      setError(null);
      return;
    }

    const fetchGeoJson = async () => {
      setLoading(true);
      setError(null);
      setGeoJson(null);
      setMeta(null);

      try {
        // 1. Get signed URL + metadata from backend
        const data = await submitRequest<MetaData>({
          url: `/geo/uploads/${uploadId}/url`,
          method: "get",
        });

        if (!data || !data.url)
          throw new Error("Failed to fetch preview details.");

        // 2. Fetch GeoJSON from S3
        const geoResponse = await fetch(data.url);
        if (!geoResponse.ok)
          throw new Error(
            `Failed to fetch GeoJSON data: ${geoResponse.status}`,
          );
        const json = (await geoResponse.json()) as GeoJSON;

        setMeta(data);
        setGeoJson(json);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load map data";
        console.error("Map Preview error:", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoJson();
  }, [uploadId]);

  // Fly to the data's bounding box once loaded
  useEffect(() => {
    if (meta?.bbox?.length === 4 && mapRef.current) {
      mapRef.current.fitBounds(
        [
          [meta.bbox[0], meta.bbox[1]],
          [meta.bbox[2], meta.bbox[3]],
        ],
        { padding: 60, duration: 600, maxZoom: 14 },
      );
    }
  }, [meta]);

  return (
    <Dialog
      open={Boolean(uploadId)}
      onClose={onClose}
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
          pr: 1,
          pt: 1,
        }}
      >
        <DialogTitle sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Map preview
          </Typography>
          {meta && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "flex", gap: 1, mt: 0.5 }}
            >
              <span>{meta.feature_count} features</span>
              <span>•</span>
              <span>{meta.geometry_type}</span>
              <span>•</span>
              <span>Original CRS: {meta.crs_original}</span>
            </Typography>
          )}
        </DialogTitle>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <DialogContent sx={{ p: 0, flex: 1, position: "relative", overflow: "hidden" }}>
        {/* The Map — always mounted inside the Dialog so there's no DOM timing issue */}
        <Map
          ref={mapRef}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          initialViewState={{
            longitude: -122.5,
            latitude: 54.5,
            zoom: 4,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />

          {/* Render GeoJSON layers once data is fetched */}
          {geoJson && (
            <Source id="preview" type="geojson" data={geoJson} tolerance={0}>
              {/* Filled polygons */}
              <Layer
                id="preview-fill"
                type="fill"
                source="preview"
                filter={["==", ["geometry-type"], "Polygon"]}
                paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.3 }}
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
                paint={{ "line-color": "#1d4ed8", "line-width": 1.5 }}
              />
              {/* Point features */}
              <Layer
                id="preview-circle"
                type="circle"
                source="preview"
                filter={["==", ["geometry-type"], "Point"]}
                paint={{
                  "circle-radius": 5,
                  "circle-color": "#3b82f6",
                  "circle-stroke-width": 1.5,
                  "circle-stroke-color": "#1d4ed8",
                }}
              />
            </Source>
          )}
        </Map>

        {/* Loading Overlay */}
        <Fade in={loading}>
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
        {error && (
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
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
