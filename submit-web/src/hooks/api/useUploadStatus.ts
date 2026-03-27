import { useEffect, useState, useRef } from "react";
import { AppConfig } from "@/utils/config";

interface UploadMetadata {
  feature_count: number;
  geometry_type: string;
  crs_original: string;
  bbox: number[];
}

interface UploadStatusEvent {
  status: string;
  upload_id: number;
  feature_count?: number;
  geometry_type?: string;
  crs_original?: string;
  bbox?: number[];
  error?: string;
}

interface UseUploadStatusOptions {
  onReady?: (uploadId: number, metadata: UploadMetadata) => void;
  onFailed?: (error: string) => void;
}

/**
 * Custom hook to track the status of a geospatial upload via Server-Sent Events (SSE).
 *
 * @param uploadId The ID of the upload to track.
 * @param options Callbacks for when the upload is ready or fails.
 * @returns The current status, metadata (if ready), and error (if failed).
 */
export const useUploadStatus = (
  uploadId: number | null,
  options: UseUploadStatusOptions = {},
) => {
  const [status, setStatus] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<UploadMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { onReady, onFailed } = options;

  useEffect(() => {
    // If no uploadId, reset state and return
    if (!uploadId) {
      setStatus(null);
      setMetadata(null);
      setError(null);
      return;
    }

    // Close any existing EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Construct the SSE URL
    // The backend is registered with url_prefix='/api/geo'
    // AppConfig.apiUrl is expected to be the base URL including /api
    const url = `${AppConfig.apiUrl}/geo/uploads/${uploadId}/status`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: UploadStatusEvent = JSON.parse(event.data);
        setStatus(data.status);

        if (data.status === "ready") {
          const meta: UploadMetadata = {
            feature_count: data.feature_count!,
            geometry_type: data.geometry_type!,
            crs_original: data.crs_original!,
            bbox: data.bbox!,
          };
          setMetadata(meta);
          onReady?.(uploadId, meta);
          eventSource.close();
        } else if (data.status === "failed") {
          const errMsg = data.error || "Processing failed";
          setError(errMsg);
          onFailed?.(errMsg);
          eventSource.close();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStatus("failed");
      const connectionError = "Lost connection";
      setError(connectionError);
      onFailed?.(connectionError);
    };

    // Cleanup: close the connection on unmount or uploadId change
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [uploadId, onReady, onFailed]);

  return { status, metadata, error };
};
