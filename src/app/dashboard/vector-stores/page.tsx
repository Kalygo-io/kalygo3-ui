"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { VectorStoresContainer } from "./vector-stores-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <VectorStoresContainer />
      </Suspense>
    </DashboardLayout>
  );
}
