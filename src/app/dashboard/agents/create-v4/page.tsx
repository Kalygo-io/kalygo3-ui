"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CreateAgentV4Container } from "../create/create-agent-v4-container";

export default async function CreateAgentV4Page() {
  await protectedPageGuard();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateAgentV4Container />
      </div>
    </DashboardLayout>
  );
}
