import { apiPost, getAuthApiBaseUrl } from "./lib/api";

export async function resetPassword(
  accountId: number,
  resetToken: string,
  newPassword: string
) {
  await apiPost<void>(
    "/api/auth/reset-password",
    {
      accountId: accountId,
      resetToken: resetToken,
      newPassword: newPassword,
    },
    { baseUrl: getAuthApiBaseUrl() }
  );
}
