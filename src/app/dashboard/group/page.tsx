"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { GroupDetailsContainer } from "./group-details-container";

export default async function Page({
  searchParams,
}: {
  searchParams: { group_id?: string };
}) {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <GroupDetailsContainer groupId={searchParams.group_id} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
