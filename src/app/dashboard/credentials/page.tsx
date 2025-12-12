import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import React from "react";

export default function Page() {
  return (
    <DashboardLayout>
      <>
        <h1 className="text-center text-5xl leading-[1.5] font-semibold leading-12 text-ellipsis overflow-hidden text-text_default_color p-1">
          Credentials
        </h1>
      </>
    </DashboardLayout>
  );
}
