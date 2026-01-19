"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CreateAgentV2Container } from "../create/create-agent-v2-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateAgentV2Container />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
