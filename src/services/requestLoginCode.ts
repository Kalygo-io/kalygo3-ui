import { apiPost, getAuthApiBaseUrl } from "./lib/api";

export async function requestLoginCode(email: string): Promise<void> {
  await apiPost<void>("/api/auth/request-code", { email }, {
    baseUrl: getAuthApiBaseUrl(),
  });
}
