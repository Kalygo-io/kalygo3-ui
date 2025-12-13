import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import React, { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-semibold text-white mb-8">Home</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              Kalygo is a labor of love. It is intended to be a bridge between
              the world of theory and real-world application. The origins of
              Kalygo date back to 2022 and have been through several iterations
              to arrive at the current form you see before you.
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              Feel free to send us your ideas with feature requests. We look
              forward to getting to know you.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </Suspense>
  );
}
