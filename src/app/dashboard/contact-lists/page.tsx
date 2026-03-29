"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ContactListsContainer } from "./contact-lists-container";

export default async function Page() {
  await protectedPageGuard();
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-gray-400">Loading contact lists...</div>}>
          <ContactListsContainer />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
