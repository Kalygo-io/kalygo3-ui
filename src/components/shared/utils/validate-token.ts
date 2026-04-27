"use server";

import { validateToken } from "@/services/validateToken";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    console.log("! protectedPageGuard !");

    const cookieStore = await cookies();

    const jwtCookie = cookieStore.get("jwt");

    if (!jwtCookie?.value) return redirect("/");

    await validateToken(jwtCookie?.value);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.log("!!! error !!!: ", error);
    return redirect("/");
  }
}
