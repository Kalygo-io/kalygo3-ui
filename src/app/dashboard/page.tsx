"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { redirect } from "next/navigation";

export default async function Page() {
  redirect("/dashboard/agent-chat");
}
