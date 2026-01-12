"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ChatbotConciergeContainer } from "./chatbot-concierge-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ChatbotConciergeContainer />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
