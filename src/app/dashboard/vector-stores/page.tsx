"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { VectorStoresContainer } from "./vector-stores-container";
import { IndexDetailsContainer } from "./index-details-container";
import { NamespaceDetailsContainer } from "./namespace-details-container";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ indexName?: string; namespace?: string }>;
}) {
  await protectedPageGuard();
  const { indexName: rawIndexName, namespace: rawNamespace } =
    await searchParams;
  const indexName = rawIndexName ? decodeURIComponent(rawIndexName) : null;
  const namespace =
    rawNamespace !== undefined ? decodeURIComponent(rawNamespace) : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          {indexName && namespace !== null ? (
            <NamespaceDetailsContainer
              indexName={indexName}
              namespace={namespace}
            />
          ) : indexName ? (
            <IndexDetailsContainer indexName={indexName} />
          ) : (
            <VectorStoresContainer />
          )}
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
