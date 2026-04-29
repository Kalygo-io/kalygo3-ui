export async function resetPassword(
  accountId: number,
  resetToken: string,
  newPassword: string
) {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: accountId,
        resetToken: resetToken,
        newPassword: newPassword,
      }),
    }
  );

  if (!resp.ok) {
    throw new Error("An error occurred");
  }
}
