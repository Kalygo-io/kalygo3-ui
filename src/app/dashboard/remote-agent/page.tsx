"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RemoteAgentContainer } from "./remote-agent-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <RemoteAgentContainer />
    </DashboardLayout>
  );
}
