"use server";

import { validateToken } from "@/services/validateToken";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("jwt");
    if (!jwtCookie?.value) {
      console.log("No jwt cookie found, redirecting to /");
      return redirect("/");
    }
    await validateToken(jwtCookie?.value);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error in protectedPageGuard: ", error);
    return redirect("/");
  }
}
