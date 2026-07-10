"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { loginAction, signInWithGoogleAction } from "../actions";

export default function LoginPage({ searchParams }: { searchParams: { redirectedFrom?: string } }) {
  const redirectedFrom = searchParams?.redirectedFrom ?? "";
  return <LoginForm redirectedFrom={redirectedFrom} />;
}

function LoginForm({ redirectedFrom }: { redirectedFrom: string }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const { toast } = useToast();

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      if (result.message === "TWO_FACTOR_REQUIRED") {
        if (needsTwoFactor) {
          toast({ title: "Incorrect code", description: "Check your authenticator app and try again.", variant: "error" });
        }
        setNeedsTwoFactor(true);
        return;
      }
      if (!result.success && result.message) {
        toast({ title: "Sign-in failed", description: result.message, variant: "error" });
      }
    });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to see where it matters.</p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required error={errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-signal hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required error={errors.password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        {needsTwoFactor && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
            <Label htmlFor="totpCode">Authenticator code</Label>
            <Input id="totpCode" name="totpCode" inputMode="numeric" maxLength={6} placeholder="000000" autoFocus />
          </motion.div>
        )}

        <Button type="submit" className="w-full" loading={isPending}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogleAction}>
        <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
        <Button type="submit" variant="secondary" className="w-full">
          <GoogleIcon /> Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to TRACKORA?{" "}
        <Link href="/signup" className="text-signal hover:underline">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.55-5.17 3.55-8.66Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.28a12 12 0 0 0 0 10.8l3.99-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
