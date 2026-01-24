/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { toast } from 'sonner';

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const router = useRouter();

  if (!signIn) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setErrors({});
    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        toast.success('Login successful!');
        router.push('/');
      } else {
        toast.warning('Additional verification required');
      }
    } catch (err: any) {
      if (err.errors?.length) {
        err.errors.forEach((error: any) => {
          switch (error.code) {
            case 'form_password_length_too_short':
              setErrors((p) => ({ ...p, password: 'Minimum 8 characters.' }));
              break;
            case 'form_password_pwned':
              setErrors((p) => ({ ...p, password: 'Password is too weak.' }));
              break;
            case 'form_identifier_exists':
              setErrors((p) => ({ ...p, email: 'Email already exists.' }));
              break;
            default:
              setErrors((p) => ({
                ...p,
                general: error.message || 'Authentication failed.',
              }));
          }
        });
      } else {
        setErrors({ general: 'Unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4">
      <Card className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]">
        
        {/* subtle top accent */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />

        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Log in to access your workspace
          </CardDescription>
        </CardHeader>

        <CardContent className="px-7 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                required
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <a
                  href="forgot-password"
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                required
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-medium shadow-md"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>

            {errors.general && (
              <p className="text-center text-sm text-red-600">
                {errors.general}
              </p>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <a href="sign-up" className="font-medium underline underline-offset-4">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
