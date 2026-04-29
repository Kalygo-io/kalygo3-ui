export interface CurrentUser {
  email: string;
  id: number;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/me`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!resp.ok) {
    const errorData = await resp
      .json()
      .catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error || `HTTP ${resp.status}`;
    throw new Error(`Failed to get current user: ${errorMessage}`);
  }

  const userData = await resp.json();
  return userData;
}
