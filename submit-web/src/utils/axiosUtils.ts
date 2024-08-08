/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppConfig, OidcConfig } from "@/utils/config";
import axios, { AxiosError } from "axios";
import { User } from "oidc-client-ts";

export type OnErrorType = (error: AxiosError) => void;
export type OnSuccessType = (data: any) => void;

const client = axios.create({ baseURL: AppConfig.apiUrl });

function getUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
  );
  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage);
}

export const request = async <T = any>({ ...options }) => {
  const user = getUser();

  if (user?.access_token) {
    client.defaults.headers.common.Authorization = `Bearer ${user?.access_token}`;
  } else {
    throw new Error("No access token!");
  }

  try {
    const response = await client.request<T>(options);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error(error.message || "Internal Server error");
    } else {
      throw error;
    }
  }
};
