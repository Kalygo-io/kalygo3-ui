export async function validateToken(token: string) {
  const url = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/validate-token`;
  console.log("[validateToken] url:", url);
  console.log("[validateToken] token (first 20 chars):", token?.slice(0, 20));

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("[validateToken] status:", resp.status, resp.statusText);

  if (!resp.ok) {
    const body = await resp.text().catch(() => "<unreadable>");
    console.error("[validateToken] response body:", body);
    throw new Error("Failed to validate token");
  }
}
