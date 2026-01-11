'use client';

import localFont from 'next/font/local';
import { Toaster } from '@/components/ui/sonner';
import { ConvexClientProvider } from '@/providers/convex-client-provider';
import './globals.css';
import { ModalProvider } from '@/providers/modal-provider';
import { Suspense } from 'react';
import { Loading } from '@/components/auth/loading';
import Head from 'next/head';

// Load custom fonts
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>MindSketch</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={<Loading />}>
          <ConvexClientProvider>
            {children}
            <Toaster />
            <ModalProvider />
          </ConvexClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
