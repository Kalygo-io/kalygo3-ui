"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { getCurrentUser } from "@/services/getCurrentUser";

export function PostHogIdentify() {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    getCurrentUser()
      .then((user) => {
        posthog.identify(String(user.id), {
          email: user.email,
        });
      })
      .catch(() => {
        // Not authenticated or network error — leave the session anonymous
      });
  }, [posthog]);

  return null;
}
