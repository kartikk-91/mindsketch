"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Sparkles,
  Lock as LockIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ErrorKey = "email" | "password" | "general";
type Errors = Partial<Record<ErrorKey, string>>;

const DEMO_CREDENTIALS = {
  email: "project.demo106@gmail.com",
  password: "demo@mindketch379235",
};

const FEATURES = [
  {
    icon: Users,
    iconBg: "bg-[#DCF3D8]",
    iconColor: "text-[#2F8F4E]",
    title: "Collaborate in real time",
    desc: "Work together seamlessly anywhere.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-[#EAE1FB]",
    iconColor: "text-[#8B5CF6]",
    title: "Visualize without limits",
    desc: "Sketch, plan, and organize your ideas.",
  },
  {
    icon: LockIcon,
    iconBg: "bg-[#DCEBFB]",
    iconColor: "text-[#3B82F6]",
    title: "Private by design",
    desc: "Your data is secure and always yours.",
  },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function Page() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!emailAddress.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSignIn = async (identifier: string, pwd: string) => {
    if (!isLoaded || !signIn) return;

    setErrors({});
    setIsLoading(true);
    try {
      const res = await signIn.create({
        identifier,
        password: pwd,
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/");
      } else {
        setErrors({ general: "Additional verification required." });
      }
    } catch (err: unknown) {
      const newErrors: Errors = {};
      if (typeof err === "object" && err && "errors" in err) {
        (err as { errors?: { code: string; message?: string }[] }).errors?.forEach(
          (error) => {
            switch (error.code) {
              case "form_identifier_not_found":
                newErrors.email = "No account found with this email.";
                break;
              case "form_password_incorrect":
                newErrors.password = "Incorrect password.";
                break;
              case "form_password_length_too_short":
                newErrors.password = "Password must be at least 8 characters.";
                break;
              case "form_param_format_invalid":
                newErrors.email = "Enter a valid email address.";
                break;
              default:
                newErrors.general = error.message || "Unable to sign in. Please try again.";
            }
          }
        );
      } else {
        newErrors.general = "We couldn't reach the server. Check your connection and try again.";
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await performSignIn(emailAddress, password);
  };

  const handleUseDemo = async () => {
    setEmailAddress(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    await performSignIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
  };

  if (!isLoaded || !signIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-black/30" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white lg:grid lg:grid-cols-2">
      {/* LEFT: brand / marketing panel — hidden below lg, no scroll needed */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-[#F6F8F1] px-12 py-10 lg:flex xl:px-16">
        <div className="absolute left-10 top-8 flex items-center gap-2 xl:left-14">
          <Image src="/logo-em.png" alt="Mindsketch" width={50} height={50} />
          <span className="text-xl font-semibold tracking-tight text-black">
            Mindsketch
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-black xl:text-[2.65rem]">
            Ideas start here.
            <br />
            Teams build here.
            <br />
            <span className="text-[#2F8F4E]">Together.</span>
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-[#5B6156]">
            Mindsketch is the collaborative whiteboard for visual thinkers,
            doers, and dreamers. Join your team and bring ideas to life.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${f.iconBg}`}
                >
                  <f.icon className={`h-4.5 w-4.5 ${f.iconColor}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-black">{f.title}</p>
                  <p className="text-sm text-[#6B7280]">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT: form panel */}
      <div className="flex h-full flex-col overflow-y-auto px-6 py-6 sm:px-10 lg:justify-center lg:overflow-visible lg:px-12 xl:px-20">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center lg:flex-none">
          <div className="mb-5 flex items-center gap-2 lg:hidden">
            <Image src="/logo-em.png" alt="Mindsketch" width={26} height={26} />
            <span className="text-base font-semibold text-black">Mindsketch</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-black">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-[#2F8F4E] hover:underline">
              Sign up
            </Link>
          </p>

          {errors.general && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-[#E7E9DE] bg-[#F6F8F1] p-4 text-center">
            <p className="text-sm font-medium text-black">Just exploring?</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Jump straight in with a demo account, no sign-up needed.
            </p>
            <button
              type="button"
              onClick={handleUseDemo}
              disabled={isLoading}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#2F8F4E]/30 bg-white text-sm font-medium text-[#2F8F4E] transition-colors hover:bg-[#DCF3D8]/50 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
                </>
              ) : (
                <>
                  Use demo account <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#E7E9DE]" />
            <span className="text-xs font-medium text-[#9AA08E]">or</span>
            <span className="h-px flex-1 bg-[#E7E9DE]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
            <div>
              <Label htmlFor="email" className="mb-1 block text-sm font-medium text-black">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                <Input
                  id="email"
                  type="email"
                  value={emailAddress}
                  autoComplete="email"
                  placeholder="Enter your email address"
                  onChange={(e) => setEmailAddress(e.target.value)}
                  aria-invalid={!!errors.email}
                  className={`h-10 pl-9 ${
                    errors.email
                      ? "border-red-400 focus-visible:ring-red-300"
                      : "focus-visible:ring-[#2F8F4E]/30"
                  }`}
                />
              </div>
              <FieldError message={errors.email} />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-black">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className={`h-10 pl-9 pr-10 ${
                    errors.password
                      ? "border-red-400 focus-visible:ring-red-300"
                      : "focus-visible:ring-[#2F8F4E]/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA08E] hover:text-black"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <div id="clerk-captcha" />

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full gap-2 bg-black text-[15px] font-medium text-white hover:bg-black/85 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}