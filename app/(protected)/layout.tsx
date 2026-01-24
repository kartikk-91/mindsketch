"use client";

import { Suspense } from "react";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { Loading } from "@/components/auth/loading";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ConvexClientProvider>
        {children}
        <ModalProvider />
      </ConvexClientProvider>
    </Suspense>
  );
}
