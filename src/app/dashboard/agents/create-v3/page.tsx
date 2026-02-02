"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { CreateAgentV3Container } from "../create/create-agent-v3-container";

export default async function CreateAgentV3Page() {
  await protectedPageGuard();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <CreateAgentV3Container />
    </div>
  );
}
