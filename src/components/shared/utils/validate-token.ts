"use server";

import { validateToken } from "@/services/validateToken";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log("[protectedPageGuard] all cookies:", allCookies.map((c) => c.name));
    const jwtCookie = cookieStore.get("jwt");
    console.log("[protectedPageGuard] jwt cookie present:", !!jwtCookie?.value, "length:", jwtCookie?.value?.length);
    if (!jwtCookie?.value) {
      console.log("[protectedPageGuard] No jwt cookie found, redirecting to /");
      return redirect("/");
    }
    await validateToken(jwtCookie.value);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[protectedPageGuard] error:", error);
    return redirect("/");
  }
}
