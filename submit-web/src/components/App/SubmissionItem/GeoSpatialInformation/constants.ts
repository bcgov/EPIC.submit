import * as yup from "yup";
import { AppConfig } from "@/utils/config";

export const geospatialSubmissionSchema = yup.object().shape({
  geospatial: yup.array().of(yup.string()),
});

export type GeoSpatialSubmissionForm = yup.InferType<
  typeof geospatialSubmissionSchema
>;

export const GEOSPATIAL_DOCUMENT_FOLDERS = Object.freeze({
  GEOSPATIAL: "geospatial",
});

const geoDocURL = AppConfig.geoDocUrl.endsWith("/") ? AppConfig.geoDocUrl.slice(0, -1) : AppConfig.geoDocUrl;

export enum GEO_DOC_LABELS {
  SPATIAL_GUIDELINE = "SPATIAL_GUIDELINE",
  EAOShapeFiles = "EAOShapeFiles",
  EAO_ESRI_FileGDB = "EAO_ESRI_FileGDB",
  EOA_QGISGeopackage = "EOA_QGISGeopackage",
}

const geoDocFilesArray = AppConfig.geoDocFiles.split(",").map((link: string) => link.trim());

export const GEO_DOC_LINKS: Record<GEO_DOC_LABELS, string> = {
  [GEO_DOC_LABELS.SPATIAL_GUIDELINE]: `${geoDocURL}/${geoDocFilesArray[0] || ""}`,
  [GEO_DOC_LABELS.EAOShapeFiles]: `${geoDocURL}/${geoDocFilesArray[1] || ""}`,
  [GEO_DOC_LABELS.EAO_ESRI_FileGDB]: `${geoDocURL}/${geoDocFilesArray[2] || ""}`,
  [GEO_DOC_LABELS.EOA_QGISGeopackage]: `${geoDocURL}/${geoDocFilesArray[3] || ""}`,
};

