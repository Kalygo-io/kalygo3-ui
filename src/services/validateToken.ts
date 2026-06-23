import { apiGet, getAuthApiBaseUrl } from "./lib/api";

export async function validateToken(token: string) {
  await apiGet<void>("/api/auth/validate-token", {
    baseUrl: getAuthApiBaseUrl(),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
