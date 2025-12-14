"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { IndexDetailsContainer } from "./index-details-container";

export default async function Page({
  params,
}: {
  params: { indexName: string };
}) {
  await protectedPageGuard();
  const indexName = decodeURIComponent(params.indexName);
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <IndexDetailsContainer indexName={indexName} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

