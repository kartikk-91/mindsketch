"use client";

import { Suspense } from "react";
import { ModalProvider } from "@/providers/modal-provider";
import { Loading } from "@/components/auth/loading";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      {children}
      <ModalProvider />
    </Suspense>
  );
}
