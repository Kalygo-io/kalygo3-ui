import { apiGet, getAuthApiBaseUrl } from "./lib/api";

export interface CurrentUser {
  email: string;
  id: number;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiGet<CurrentUser>("/api/auth/me", { baseUrl: getAuthApiBaseUrl() });
}
