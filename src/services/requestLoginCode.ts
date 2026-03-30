export async function requestLoginCode(email: string): Promise<void> {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/request-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }
  );

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Failed to send code");
  }
}
