"use client";
import { Loading } from "@/components/auth/loading";
import { Plus_Jakarta_Sans } from "next/font/google";
import { useEffect, useState } from "react";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);


  if (isLoading) {
    return <Loading/>;
  }

  return (
    <div className={plusJakarta.className}>
      {children}
    </div>
  );
}
