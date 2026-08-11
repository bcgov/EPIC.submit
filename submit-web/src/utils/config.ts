import { WebStorageStateStore } from "oidc-client-ts";

declare global {
  interface Window {
    _env_: {
      VITE_API_URL: string;
      VITE_ENV: string;
      VITE_VERSION: string;
      VITE_APP_TITLE: string;
      VITE_APP_URL: string;
      VITE_OIDC_AUTHORITY: string;
      VITE_CLIENT_ID: string;
      VITE_OBJECT_STORAGE_URL: string;
      VITE_CONDITIONS_LIBRARY_URL: string;
      VITE_CENTRE_API_URL: string;
      VITE_USER_GUIDE: string;
      VITE_GEO_DOC_URL: string;
      VITE_EPIC_SYSTEM_EMAIL: string;
      VITE_SUPPORT_MP_EMAIL: string;
      VITE_SUPPORT_IPD_EMAIL: string;
    };
  }
}
const API_URL =
  window._env_?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
const OBJECT_STORAGE_URL =
  window._env_?.VITE_OBJECT_STORAGE_URL ||
  import.meta.env.VITE_OBJECT_STORAGE_URL ||
  "";
const CONDITIONS_LIBRARY_URL =
  window._env_?.VITE_CONDITIONS_LIBRARY_URL ||
  import.meta.env.VITE_CONDITIONS_LIBRARY_URL ||
  "";
const CENTRE_API_URL =
  window._env_?.VITE_CENTRE_API_URL ||
  import.meta.env.VITE_CENTRE_API_URL ||
  "";
const APP_ENVIRONMENT =
  window._env_?.VITE_ENV || import.meta.env.VITE_ENV || "";
const APP_VERSION =
  window._env_?.VITE_VERSION || import.meta.env.VITE_VERSION || "";
const APP_TITLE =
  window._env_?.VITE_APP_TITLE || import.meta.env.VITE_APP_TITLE || "";
const APP_URL = window._env_?.VITE_APP_URL || import.meta.env.VITE_APP_URL;
const OIDC_AUTHORITY =
  window._env_?.VITE_OIDC_AUTHORITY || import.meta.env.VITE_OIDC_AUTHORITY;
const CLIENT_ID =
  window._env_?.VITE_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;
const USER_GUIDE =
  window._env_?.VITE_USER_GUIDE || import.meta.env.VITE_USER_GUIDE || "";
const GEO_DOC_URL =
  window._env_?.VITE_GEO_DOC_URL || import.meta.env.VITE_GEO_DOC_URL || "";
const EPIC_SYSTEM_EMAIL =
  window._env_?.VITE_EPIC_SYSTEM_EMAIL ||
  import.meta.env.VITE_EPIC_SYSTEM_EMAIL ||
  "";
const SUPPORT_MP_EMAIL =
  window._env_?.VITE_SUPPORT_MP_EMAIL ||
  import.meta.env.VITE_SUPPORT_MP_EMAIL ||
  "";
const SUPPORT_IPD_EMAIL =
  window._env_?.VITE_SUPPORT_IPD_EMAIL ||
  import.meta.env.VITE_SUPPORT_IPD_EMAIL ||
  "";

export const AppConfig = {
  apiUrl: `${API_URL}`,
  documentUrl: `${OBJECT_STORAGE_URL}`,
  conditionsLibraryUrl: `${CONDITIONS_LIBRARY_URL}`,
  centreApiUrl: `${CENTRE_API_URL}`,
  environment: APP_ENVIRONMENT,
  version: APP_VERSION,
  appTitle: APP_TITLE,
  appUrl: APP_URL,
  clientId: CLIENT_ID,
  epicSystemEmail: EPIC_SYSTEM_EMAIL,
  supportMpEmail: SUPPORT_MP_EMAIL,
  supportIpdEmail: SUPPORT_IPD_EMAIL,
  userGuide: USER_GUIDE,
  geoDocUrl: GEO_DOC_URL,
};

const trimmedAppUrl = APP_URL?.endsWith("/") ? APP_URL.slice(0, -1) : APP_URL;

export const OidcConfig = {
  authority: OIDC_AUTHORITY,
  kc_idp_hint: "idir",
  client_id: CLIENT_ID,
  redirect_uri: `${trimmedAppUrl}/oidc-callback`,
  post_logout_redirect_uri: `${trimmedAppUrl}/`,
  scope: "openid profile email",
  response_type: "code",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};
