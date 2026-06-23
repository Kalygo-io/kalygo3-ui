import { apiPost, getAuthApiBaseUrl } from "./lib/api";

export async function requestPasswordReset(email: string) {
  await apiPost<void>(
    "/api/auth/request-password-reset",
    {
      email: email,
    },
    { baseUrl: getAuthApiBaseUrl() }
  );
}
