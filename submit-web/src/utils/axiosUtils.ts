import { AppConfig, OidcConfig } from "@/utils/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { User } from "oidc-client-ts";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useAccount } from "@/store/accountStore";
import {
  ACCESS_REVOKED_ERROR_CODE,
  HTTP_STATUS,
  NEED_ACCESS_PATH,
} from "@/utils/constants";

export type OnErrorType = (error: AxiosError) => void;
export type OnSuccessType = (data: any) => void;

const submitClient = axios.create({ baseURL: AppConfig.apiUrl });
const documentClient = axios.create({ baseURL: AppConfig.documentUrl });
const conditionLibraryClient = axios.create({
  baseURL: AppConfig.conditionsLibraryUrl,
});
const axiosClient = axios.create();

/**
 * Returns true when the error is a 403 whose body carries the ACCESS_REVOKED
 * error code. This is distinct from an ordinary 403 (insufficient permissions),
 * which should not eject the user from the app.
 */
export const isAccessRevokedError = (error: AxiosError): boolean => {
  if (error.response?.status !== HTTP_STATUS.FORBIDDEN) {
    return false;
  }
  const data = error.response?.data as { error_code?: string } | undefined;
  return data?.error_code === ACCESS_REVOKED_ERROR_CODE;
};

/**
 * Ejects a revoked user: clears cached account state and redirects to the
 * need-access page. Works outside React since it uses the store's imperative
 * API and window.location. Guards against redirect loops.
 */
export const handleAccessRevoked = () => {
  try {
    useAccount.getState().reset();
  } catch {
    // Store may be unavailable in some contexts; redirect regardless.
  }
  if (window.location.pathname !== NEED_ACCESS_PATH) {
    window.location.assign(NEED_ACCESS_PATH);
  }
};

/**
 * Attaches a response interceptor that ejects revoked users on any API call.
 */
const attachAccessRevokedInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (isAccessRevokedError(error)) {
        handleAccessRevoked();
      }
      return Promise.reject(error);
    },
  );
};

[submitClient, documentClient, conditionLibraryClient].forEach(
  attachAccessRevokedInterceptor,
);

function getUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
  );
  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage);
}

const getAuthToken = () => {
  const user = getUser();
  if (user?.access_token) {
    return user.access_token;
  }
  throw new Error("No access token");
};

const setAuthToken = (client: AxiosInstance) => {
  const authToken = getAuthToken();

  client.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export const submitRequest = async <T = any>({ ...options }) => {
  setAuthToken(submitClient);

  const response = await submitClient.request<T>(options);
  return response.data;
};

export const publicRequest = async <T = any>({ ...options }) => {
  const response = await submitClient.request<T>(options);
  return response.data;
};

export const conditionLibraryRequest = async <T = any>({ ...options }) => {
  setAuthToken(conditionLibraryClient);

  const response = await conditionLibraryClient.request<T>(options);
  return response.data;
};

export const documentRequest = async <T = any>({ ...options }) => {
  setAuthToken(documentClient);

  const response = await documentClient.request<T>(options);
  return response.data;
};

type ErrorResponseData = {
  message: string;
};
export const requestAxios = async ({ ...options }) => {
  try {
    const response = await axiosClient(options); // Use the global instance
    return response?.data ?? response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw new Error("Unexpected error occurred!");
    }

    if (!error.response) {
      notify.error("Network error or CORS issue");
      throw new Error("Network error or CORS issue");
    } else {
      notify.error(
        (error.response?.data as ErrorResponseData)?.message ??
          error.message ??
          "API Error!",
      );
    }
    throw error;
  }
};
