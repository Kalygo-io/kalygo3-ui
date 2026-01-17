"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { VectorStoresContainer } from "./vector-stores-container";
import { IndexDetailsContainer } from "./index-details-container";

export default async function Page({
  searchParams,
}: {
  searchParams: { indexName?: string };
}) {
  await protectedPageGuard();
  const indexName = searchParams.indexName
    ? decodeURIComponent(searchParams.indexName)
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          {indexName ? (
            <IndexDetailsContainer indexName={indexName} />
          ) : (
            <VectorStoresContainer />
          )}
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
