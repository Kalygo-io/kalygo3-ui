"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { KalygoAgentContainer } from "./kalygo-agent-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <KalygoAgentContainer />
    </DashboardLayout>
  );
}
