import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import React, { Suspense } from "react";
import { CredentialsContainer } from "./credentials-container";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CredentialsContainer />
        </div>
      </DashboardLayout>
    </Suspense>
  );
}
