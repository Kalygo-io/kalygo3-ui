import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import React, { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout>
        <>
          <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
            Apps
          </h1>
        </>
      </DashboardLayout>
    </Suspense>
  );
}
