"use server";

import { redirect } from "next/navigation";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { HierarchicalAgentChatContainer } from "./hierarchical-agent-chat-container";

export default async function Page() {
  try {
    await protectedPageGuard();
    return (
      <DashboardLayout>
        <HierarchicalAgentChatContainer />
      </DashboardLayout>
    );
  } catch {
    return redirect("/");
  }
}
