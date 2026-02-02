"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { EditPromptContainer } from "./edit-prompt-container";

export default async function EditPromptPage({
  params,
}: {
  params: { promptId: string };
}) {
  await protectedPageGuard();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <EditPromptContainer promptId={params.promptId} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
