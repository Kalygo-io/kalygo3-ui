"use server";

import { redirect } from "next/navigation";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";

export default async function Page() {
  try {
    await protectedPageGuard();
    redirect("/dashboard/prompts");
  } catch {
    redirect("/");
  }
}
