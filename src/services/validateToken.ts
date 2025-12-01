export async function validateToken(token: string) {
  console.log(`${process.env.NEXT_PUBLIC_AUTH_API_URL}`);

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/validate-token`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log("resp.ok: ", resp.ok);

  if (!resp.ok) {
    throw new Error("Failed to validate token");
  }
}
