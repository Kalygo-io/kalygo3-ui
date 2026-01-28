"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AgentChatSessionPage } from "./agent-chat-session-page";

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  await protectedPageGuard();
  const { sessionId } = await params;
  
  return (
    <DashboardLayout>
      <AgentChatSessionPage sessionId={sessionId} />
    </DashboardLayout>
  );
}
