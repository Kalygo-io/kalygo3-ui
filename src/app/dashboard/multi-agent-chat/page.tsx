"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { MultiAgentChatContainer } from "./multi-agent-chat-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <MultiAgentChatContainer />
    </DashboardLayout>
  );
}
