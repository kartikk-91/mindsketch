"use client";

import { useSignUp, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
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

type ErrorKey =
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "password"
  | "code"
  | "general";

type Errors = Partial<Record<ErrorKey, string>>;

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
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const usernameValid = username.trim().length >= 3;
  const passwordStrong = password.length >= 8;

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!emailAddress.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signUp.create({ firstName, lastName, username, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: unknown) {
      const newErrors: Errors = {};
      if (typeof err === "object" && err && "errors" in err) {
        (err as { errors?: { code: string; message?: string }[] }).errors?.forEach(
          (error) => {
            switch (error.code) {
              case "form_identifier_exists":
                newErrors.email = "That email is already in use.";
                break;
              case "form_username_exists":
                newErrors.username = "That username is already taken.";
                break;
              case "form_password_length_too_short":
              case "form_password_pwned":
                newErrors.password = error.message || "Choose a stronger password.";
                break;
              case "form_param_format_invalid":
                newErrors.email = "Enter a valid email address.";
                break;
              default:
                newErrors.general = error.message || "Something went wrong. Please try again.";
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setErrors({});
    setIsVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setErrors({ code: "That code didn't work. Double-check it and try again." });
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "errors" in err
          ? (err as { errors?: { message?: string }[] }).errors?.[0]?.message
          : undefined;
      setErrors({ code: message || "Invalid or expired verification code." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    setSuccessMessage("");
    setErrors({});
    setIsResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setSuccessMessage("A new code is on its way to your inbox.");
    } catch {
      setErrors({ code: "Couldn't resend the code. Try again in a moment." });
    } finally {
      setIsResending(false);
    }
  };

  if (!isLoaded || !signUp || !signIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-black/30" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white lg:grid lg:grid-cols-2">
      
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

      
      <div className="flex h-full flex-col overflow-y-auto px-6 py-6 sm:px-10 lg:justify-center lg:overflow-visible lg:px-12 xl:px-20">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center lg:flex-none">
          <div className="mb-5 flex items-center gap-2 lg:hidden">
            <Image src="/logo-em.png" alt="Mindsketch" width={26} height={26} />
            <span className="text-base font-semibold text-black">Mindsketch</span>
          </div>

          {!verifying ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-black">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-[#2F8F4E] hover:underline">
                  Log in
                </Link>
              </p>

              {errors.general && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" noValidate>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName" className="mb-1 block text-sm font-medium text-black">
                      First name
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                      <Input
                        id="firstName"
                        value={firstName}
                        autoComplete="given-name"
                        placeholder="First name"
                        onChange={(e) => setFirstName(e.target.value)}
                        aria-invalid={!!errors.firstName}
                        className={`h-10 pl-9 ${
                          errors.firstName
                            ? "border-red-400 focus-visible:ring-red-300"
                            : "focus-visible:ring-[#2F8F4E]/30"
                        }`}
                      />
                    </div>
                    <FieldError message={errors.firstName} />
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="mb-1 block text-sm font-medium text-black">
                      Last name
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                      <Input
                        id="lastName"
                        value={lastName}
                        autoComplete="family-name"
                        placeholder="Last name"
                        onChange={(e) => setLastName(e.target.value)}
                        aria-invalid={!!errors.lastName}
                        className={`h-10 pl-9 ${
                          errors.lastName
                            ? "border-red-400 focus-visible:ring-red-300"
                            : "focus-visible:ring-[#2F8F4E]/30"
                        }`}
                      />
                    </div>
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="username" className="mb-1 block text-sm font-medium text-black">
                    Username
                  </Label>
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                    <Input
                      id="username"
                      value={username}
                      autoComplete="username"
                      placeholder="Choose a username"
                      onChange={(e) => setUsername(e.target.value)}
                      aria-invalid={!!errors.username}
                      className={`h-10 pl-9 pr-9 ${
                        errors.username
                          ? "border-red-400 focus-visible:ring-red-300"
                          : "focus-visible:ring-[#2F8F4E]/30"
                      }`}
                    />
                    {usernameValid && !errors.username && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F8F4E]" />
                    )}
                  </div>
                  <FieldError message={errors.username} />
                </div>

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
                  <Label htmlFor="password" className="mb-1 block text-sm font-medium text-black">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA08E]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="new-password"
                      placeholder="Create a password"
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

                  {!errors.password && password.length > 0 && (
                    <div
                      className={`mt-2 flex items-start gap-2 rounded-lg p-2.5 ${
                        passwordStrong ? "bg-[#EAF7E6]" : "bg-[#F6F8F1] border border-[#E7E9DE]"
                      }`}
                    >
                      <ShieldCheck
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          passwordStrong ? "text-[#2F8F4E]" : "text-[#9AA08E]"
                        }`}
                      />
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            passwordStrong ? "text-[#2F8F4E]" : "text-[#6B7280]"
                          }`}
                        >
                          {passwordStrong ? "Strong password" : "Password strength"}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          At least 8 characters, mixing letters, numbers &amp; symbols.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div id="clerk-captcha" />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full gap-2 bg-black text-[15px] font-medium text-white hover:bg-black/85 disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-[#9AA08E]">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="font-medium text-[#2F8F4E] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-[#2F8F4E] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-black">
                Check your inbox
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-black">{emailAddress}</span>
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
                <div>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    aria-invalid={!!errors.code}
                    className={`h-14 text-center text-2xl font-semibold tracking-[0.5em] ${
                      errors.code
                        ? "border-red-400 focus-visible:ring-red-300"
                        : "focus-visible:ring-[#2F8F4E]/30"
                    }`}
                  />
                  {errors.code && (
                    <p className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.code}
                    </p>
                  )}
                  {successMessage && !errors.code && (
                    <p className="mt-2 text-center text-xs font-medium text-[#2F8F4E]">
                      {successMessage}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying || code.length !== 6}
                  className="h-11 w-full gap-2 bg-black text-[15px] font-medium text-white hover:bg-black/85 disabled:opacity-40"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify email <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="mt-5 w-full text-center text-sm font-medium text-[#6B7280] hover:text-black disabled:opacity-50"
              >
                {isResending ? "Sending…" : "Didn't get it? Resend code"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}