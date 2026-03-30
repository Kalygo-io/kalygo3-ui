export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/verify-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
      credentials: "include",
    }
  );

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Invalid or expired code");
  }
}
