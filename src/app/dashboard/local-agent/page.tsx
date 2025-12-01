"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { LocalAgentContainer } from "./local-agent-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <LocalAgentContainer />
    </DashboardLayout>
  );
}
