/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';


const DEMO_CREDENTIALS = {
  email: 'demo@mindsketch.app',
  password: 'demo12345',
};

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  if (!signIn) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setErrors({});
    setIsLoading(true);

    try {
      const res = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (res.status === 'complete') {
        await setActive({ session: res.createdSessionId });
        toast.success('Welcome back to Mindsketch ✨');
        router.push('/');
      } else {
        toast('Additional verification required');
      }
    } catch (err: any) {
      const mappedErrors: typeof errors = {};

      err?.errors?.forEach((e: any) => {
        switch (e.code) {
          case 'form_identifier_not_found':
            mappedErrors.email = 'No account found with this email.';
            break;
          case 'form_password_incorrect':
            mappedErrors.password = 'Incorrect password.';
            break;
          case 'form_password_length_too_short':
            mappedErrors.password = 'Password must be at least 8 characters.';
            break;
          default:
            mappedErrors.general =
              e.message || 'Unable to sign in. Please try again.';
        }
      });

      setErrors(mappedErrors);
      toast.error('Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4 overflow-hidden">

            <Image
        src="/hero-banner.svg"
        alt="background"
        fill
        className="absolute top-0 object-cover opacity-70"
        priority
      />

            <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border border-slate-200">

                    <CardHeader className="text-center pt-8 space-y-3">
            <div className="flex justify-center">
              <Image
                src="/logo-em.png"
                alt="Mindsketch"
                width={44}
                height={44}
                priority
              />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to continue collaborating on Mindsketch
            </CardDescription>
          </CardHeader>

          <CardContent className="px-7 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">

                            <div className="space-y-2">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="h-11"
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-600"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

                            <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-600"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

                            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>

                            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center space-y-3"
              >
                <p className="text-sm font-medium text-slate-700">
                  👋 Just exploring?
                </p>


                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => {
                    setEmailAddress(DEMO_CREDENTIALS.email);
                    setPassword(DEMO_CREDENTIALS.password);
                    toast('Demo credentials filled');
                  }}
                >
                  Use demo account
                </Button>
              </motion.div>

                            <AnimatePresence>
                {errors.general && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-sm text-red-600"
                  >
                    {errors.general}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="font-medium underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
