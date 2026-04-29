import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/shared/forms/reset-password-form";

export default function RequestPasswordReset() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
