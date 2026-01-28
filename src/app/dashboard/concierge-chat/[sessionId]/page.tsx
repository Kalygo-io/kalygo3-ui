"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ConciergeChatSessionPage } from "./concierge-chat-session-page";

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
      <ConciergeChatSessionPage sessionId={sessionId} />
    </DashboardLayout>
  );
}
