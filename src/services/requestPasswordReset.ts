export async function requestPasswordReset(email: string) {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/request-password-reset`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    }
  );

  if (!resp.ok) {
    throw new Error("An error occurred");
  }
}
