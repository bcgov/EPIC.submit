// App Constants should go here
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const DEFAULT_ACCEPTED_FILE_TYPES = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
];

// Default maximum upload size for documents (in MB).
export const DEFAULT_MAX_FILE_SIZE_MB = 500;

// Geospatial files (.shp/.zip) are capped lower because processing large
// files is expensive and can time out. This limit applies to geospatial only.
export const GEO_MAX_FILE_SIZE_MB = 20;
export const GEO_MAX_FILE_SIZE_BYTES = GEO_MAX_FILE_SIZE_MB * 1024 * 1024;

export const EXTENSION_TO_MIME_TYPE_MAP: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  zip: ["application/zip", "application/x-zip-compressed"],
  shp: ["application/octet-stream"],
};

// Item type name for GIS/Geospatial submissions
export const GIS_ITEM_TYPE_NAME = "Geospatial Information";
