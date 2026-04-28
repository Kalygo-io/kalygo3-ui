"use server";

import { validateToken } from "@/services/validateToken";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    console.log("protectedPageGuard called");

    const cookieStore = await cookies();
    console.log("cookieStore: ", cookieStore);

    const jwtCookie = cookieStore.get("jwt");
    console.log("jwtCookie: ", jwtCookie);

    if (!jwtCookie?.value) {
      console.log("No jwt cookie found, redirecting to /");
      return redirect("/");
    }

    console.log("Validating JWT token...");
    await validateToken(jwtCookie?.value);
    console.log("JWT token validated successfully");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error in protectedPageGuard: ", error);
    return redirect("/");
  }
}
