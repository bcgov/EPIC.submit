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

export const geoDocURL = AppConfig.geoDocUrl.endsWith("/") ? AppConfig.geoDocUrl.slice(0, -1) : AppConfig.geoDocUrl;
