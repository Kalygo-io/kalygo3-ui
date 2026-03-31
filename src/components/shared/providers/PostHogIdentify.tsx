"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { getAccount } from "@/services/accountService";

export function PostHogIdentify() {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    getAccount()
      .then((account) => {
        posthog.identify(String(account.id), {
          email: account.email,
        });
      })
      .catch(() => {
        // Not authenticated or network error — leave the session anonymous
      });
  }, [posthog]);

  return null;
}
