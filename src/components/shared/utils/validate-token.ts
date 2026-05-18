"use server";

import { validateToken } from "@/services/validateToken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function protectedPageGuard() {
  const cookieStore = await cookies();
  const jwtCookie = cookieStore.get("jwt");
  if (!jwtCookie?.value) {
    redirect("/");
  }
  try {
    await validateToken(jwtCookie.value);
  } catch {
    redirect("/");
  }
}
