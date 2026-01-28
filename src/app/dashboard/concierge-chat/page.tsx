"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ConciergeChatContainer } from "./concierge-chat-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <ConciergeChatContainer />
    </DashboardLayout>
  );
}
