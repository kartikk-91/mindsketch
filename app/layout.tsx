import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});



export const metadata: Metadata = {
  title: {
    default: "MindSketch",
    template: "%s | MindSketch",
  },
  description:
    "MindSketch is a real-time collaborative whiteboard with an infinite canvas, smart drawing tools, templates, history restoration, and AI-powered canvas summaries.",

  keywords: [
    "real-time whiteboard",
    "collaborative whiteboard",
    "online brainstorming tool",
    "infinite canvas",
    "team collaboration tool",
    "AI whiteboard",
    "visual collaboration",
    "MindSketch",
  ],

  authors: [{ name: "Kartik Pokhriyal" }],
  creator: "Kartik Pokhriyal",
  publisher: "MindSketch",

  metadataBase: new URL("https://mindsketch.kartikpokhriyal.work"),

  openGraph: {
    title: "MindSketch",
    description:
      "A modern collaborative whiteboard with infinite canvas, real-time collaboration, and AI-powered insights.",
    url: "https://mindsketch.kartikpokhriyal.work",
    siteName: "MindSketch",
    type: "website",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "MindSketch",
    description:
      "Collaborate visually with an infinite canvas and AI-powered summaries.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  category: "technology",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/sign-in"
        >
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
