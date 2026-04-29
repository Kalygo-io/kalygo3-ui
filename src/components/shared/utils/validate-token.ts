"use server";

import { validateToken } from "@/services/validateToken";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const jwtCookie = cookieStore.get("jwt");
    if (!jwtCookie?.value) {
      return redirect("/");
    }
    await validateToken(jwtCookie.value);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return redirect("/");
  }
}
