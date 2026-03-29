import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Suspense } from "react";
import { HomeContainer } from "./home-container";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="space-y-8 animate-pulse">
              <div className="h-28 bg-gray-800/50 rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 bg-gray-800/50 rounded-2xl" />
                ))}
              </div>
            </div>
          }
        >
          <HomeContainer />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
