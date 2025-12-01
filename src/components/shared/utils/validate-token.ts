"use server";

import { validateToken } from "@/services/validateToken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  try {
    console.log("! protectedPageGuard !");

    const cookieStore = cookies();

    console.log("cookieStore: ", cookieStore);

    const jwtCookie = cookieStore.get("jwt");

    console.log("jwtCookie: ", jwtCookie?.value);

    if (!jwtCookie?.value) return redirect("/auth");

    await validateToken(jwtCookie?.value);
  } catch (error) {
    console.log("!!! error !!!: ", error);
    return redirect("/auth");
  }
}
