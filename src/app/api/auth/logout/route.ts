import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt")?.value;

  if (jwt) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/log-out`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
    } catch {
      // Best-effort — clear the cookie regardless
    }
  }

  cookieStore.delete("jwt");

  return NextResponse.json({ ok: true });
}
