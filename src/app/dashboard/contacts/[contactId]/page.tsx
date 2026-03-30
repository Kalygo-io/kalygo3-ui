"use server";

import { Suspense } from "react";
import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ContactDetailContainer } from "./contact-detail-container";

export default async function Page({ params }: { params: Promise<{ contactId: string }> }) {
  await protectedPageGuard();
  const { contactId: contactIdStr } = await params;
  const contactId = parseInt(contactIdStr, 10);
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="text-gray-400">Loading contact…</div>}>
          <ContactDetailContainer contactId={contactId} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
