export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const resp = await fetch("/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error ?? "Invalid or expired code");
  }
}
