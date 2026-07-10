"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { signUpAction } from "../actions";

export default function SignUpPage({ searchParams }: { searchParams: { redirectedFrom?: string } }) {
  const redirectedFrom = searchParams?.redirectedFrom ?? "";
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      if (result.success) {
        setDone(true);
      } else if (result.message) {
        toast({ title: "Couldn't sign up", description: result.message, variant: "error" });
      }
    });
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h1 className="font-display text-2xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to your email. Click it to activate your account.
        </p>
        <Link href={`/login${redirectedFrom ? `?redirectedFrom=${encodeURIComponent(redirectedFrom)}` : ""}`} className="mt-6 inline-block text-sm text-signal hover:underline">
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1 className="font-display text-2xl font-semibold text-foreground">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start sharing on your terms.</p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required error={errors.fullName} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required error={errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required error={errors.password} />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          <p className="text-xs text-muted-foreground">At least 10 characters, with upper, lower, number, and symbol.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" className="w-full" loading={isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-signal hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
