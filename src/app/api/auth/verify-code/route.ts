import { NextResponse } from "next/server";

function getPublicHostname(request: Request): string {
  const raw =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    new URL(request.url).hostname;
  return raw.replace(/:\d+$/, "");
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export async function POST(request: Request) {
  const { email, code } = await request.json();

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth/verify-code`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    },
  );

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.detail ?? "Invalid or expired code" },
      { status: resp.status },
    );
  }

  const setCookieHeader = resp.headers.get("set-cookie");

  if (setCookieHeader) {
    const match = setCookieHeader.match(/jwt=([^;]+)/);
    if (match) {
      const isProduction = process.env.NODE_ENV === "production";
      const host = getPublicHostname(request);
      const cookieDomain = LOOPBACK.has(host)
        ? undefined
        : process.env.COOKIE_DOMAIN || host;

      const res = NextResponse.json({ ok: true });
      res.cookies.set("jwt", match[1], {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
      return res;
    }
  }

  console.warn("[verify-code] no jwt found in upstream response, returning without cookie");
  return NextResponse.json({ ok: true });
}
