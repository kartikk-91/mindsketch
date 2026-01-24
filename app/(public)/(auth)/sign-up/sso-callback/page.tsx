/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function finalizeOAuth() {
      try {
        const result = await clerk.handleRedirectCallback({});

        // Clerk may or may not return the session id explicitly,
        // but the session IS created at this point.
        if ((result as any)?.createdSessionId) {
          await clerk.setActive({
            session: (result as any).createdSessionId,
          });
        }

        router.replace("/onboarding");
      } catch (err) {
        console.error("OAuth callback failed:", err);
      }
    }

    finalizeOAuth();
  }, [clerk, router]);

  return <div>Preparing your account…</div>;
}
