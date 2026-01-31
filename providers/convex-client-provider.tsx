"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/auth/loading";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

function RedirectToSignIn() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return <Loading />;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

 
  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <ConvexProviderWithClerk  useAuth={useAuth} client={convex}>
      {!isSignedIn ? (
        <RedirectToSignIn />
      ) : (
        children
      )}
    </ConvexProviderWithClerk>
  );
}
