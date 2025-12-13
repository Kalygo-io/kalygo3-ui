"use server";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { VectorStoresContainer } from "./vector-stores-container";

export default async function Page() {
  return (
    <DashboardLayout>
      <VectorStoresContainer />
    </DashboardLayout>
  );
}
