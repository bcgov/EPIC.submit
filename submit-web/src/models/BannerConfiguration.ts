export const BANNER_TYPE = {
  INFO: "Info",
  SUCCESS: "Success",
  WARNING: "Warning",
  FAILURE: "Failure",
  NONE: "None",
} as const;

export type BannerType = (typeof BANNER_TYPE)[keyof typeof BANNER_TYPE];

export interface BannerConfiguration {
  id: number;
  banner_type: BannerType;
  content: string;
  is_active: boolean;
  created_date?: string;
  updated_date?: string;
}

export interface BannerConfigurationPayload {
  banner_type: BannerType;
  content: string;
  is_active: boolean;
}
