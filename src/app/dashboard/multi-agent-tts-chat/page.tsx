"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { MultiAgentTtsChatContainer } from "./multi-agent-tts-chat-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <MultiAgentTtsChatContainer />
    </DashboardLayout>
  );
}
