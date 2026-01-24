"use client";

import { useSignUp, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ================= TYPES ================= */

type ErrorKey =
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "password"
  | "code"
  | "general";

type Errors = Partial<Record<ErrorKey, string>>;

/* ================= PAGE ================= */

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();
  const router = useRouter();

  /* ================= STATE ================= */

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState<Errors>({});

  if (!signUp || !signIn) return null;

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!emailAddress.trim()) newErrors.email = "Email is required.";

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setErrors({});
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        username,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setVerifying(true);
    } catch (err: unknown) {
      const newErrors: Errors = {};

      if (typeof err === "object" && err && "errors" in err) {
        (err as { errors?: { code: string; message?: string }[] }).errors?.forEach(
          (error) => {
            switch (error.code) {
              case "form_identifier_exists":
                newErrors.email = "Email already in use.";
                break;
              case "form_username_exists":
                newErrors.username = "Username already taken.";
                break;
              case "form_password_length_too_short":
                newErrors.password = "Password must be at least 8 characters.";
                break;
              default:
                newErrors.general = error.message || "Signup failed.";
            }
          }
        );
      } else {
        newErrors.general = "Something went wrong.";
      }

      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= VERIFY ================= */

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setErrors({});
    setIsVerifying(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch {
      setErrors({ code: "Invalid or expired verification code." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    await signUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });
    setSuccessMessage("Verification code sent.");
  };

  /* ================= VERIFY UI ================= */

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4">
        <Card className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your inbox
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className={`h-12 text-center tracking-[0.35em] text-lg ${
                  errors.code
                    ? "border-red-500 focus-visible:ring-red-400"
                    : ""
                }`}
              />

              {errors.code && (
                <p className="text-sm text-red-600 text-center">
                  {errors.code}
                </p>
              )}

              {successMessage && (
                <p className="text-sm text-green-600 text-center">
                  {successMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className="w-full h-11"
              >
                {isVerifying ? "Verifying…" : "Verify email"}
              </Button>
            </form>

            <button
              onClick={handleResendCode}
              className="text-sm text-slate-600 hover:underline w-full text-center"
            >
              Resend code
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ================= SIGNUP UI ================= */

  const nameFields: [
    string,
    string,
    React.Dispatch<React.SetStateAction<string>>,
    ErrorKey
  ][] = [
    ["First name", firstName, setFirstName, "firstName"],
    ["Last name", lastName, setLastName, "lastName"],
  ];

  const fields: [
    string,
    string,
    React.Dispatch<React.SetStateAction<string>>,
    ErrorKey,
    string?
  ][] = [
    ["Username", username, setUsername, "username"],
    ["Email", emailAddress, setEmailAddress, "email", "email"],
    ["Password", password, setPassword, "password", "password"],
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4">
      <Card className="w-full max-w-lg rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Create your account
          </CardTitle>
          <CardDescription>
            Fill in your details to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {errors.general && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {nameFields.map(([label, value, setter, key]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className={
                      errors[key]
                        ? "border-red-500 focus-visible:ring-red-400"
                        : ""
                    }
                  />
                  {errors[key] && (
                    <p className="text-xs text-red-600">{errors[key]}</p>
                  )}
                </div>
              ))}
            </div>

            {fields.map(([label, value, setter, key, type]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type={type ?? "text"}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={
                    errors[key]
                      ? "border-red-500 focus-visible:ring-red-400"
                      : ""
                  }
                />
                {errors[key] && (
                  <p className="text-xs text-red-600">{errors[key]}</p>
                )}
              </div>
            ))}

            <div id="clerk-captcha" />

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
