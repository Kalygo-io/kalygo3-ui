"use server";

import { protectedPageGuard } from "@/components/shared/utils/validate-token";
import { CreatePromptContainer } from "./create-prompt-container";

export default async function CreatePromptPage() {
  await protectedPageGuard();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <CreatePromptContainer />
    </div>
  );
}
