export async function validateToken(token: string) {
  const url = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/validate-token`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "<unreadable>");
    console.error("[validateToken] failed:", resp.status, body);
    throw new Error("Failed to validate token");
  }
}
