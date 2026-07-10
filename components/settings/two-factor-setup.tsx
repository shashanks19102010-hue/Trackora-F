"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import {
  generateTwoFactorSecretAction,
  verifyTwoFactorAction,
  disableTwoFactorAction,
} from "@/app/(dashboard)/settings/actions";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState<"idle" | "scanning">("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function startSetup() {
    startTransition(async () => {
      const result = await generateTwoFactorSecretAction();
      if (result.success) {
        setQrDataUrl(result.qrDataUrl);
        setStep("scanning");
      }
    });
  }

  function confirmCode() {
    startTransition(async () => {
      const result = await verifyTwoFactorAction(code);
      toast({
        title: result.success ? "2FA enabled" : "Invalid code",
        description: result.message,
        variant: result.success ? "success" : "error",
      });
      if (result.success) setStep("idle");
    });
  }

  function disable() {
    startTransition(async () => {
      await disableTwoFactorAction();
      toast({ title: "Two-factor authentication disabled" });
    });
  }

  if (enabled) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-mint/30 bg-mint/5 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-mint" />
          <p className="text-sm font-medium">Two-factor authentication is on</p>
        </div>
        <Button variant="outline" size="sm" onClick={disable} loading={isPending}>
          <ShieldOff className="h-4 w-4" /> Turn off
        </Button>
      </div>
    );
  }

  if (step === "scanning" && qrDataUrl) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Scan this with Google Authenticator, 1Password, or any TOTP app.</p>
        <div className="flex justify-center rounded-xl bg-white p-4">
          <Image src={qrDataUrl} alt="Two-factor QR code" width={180} height={180} unoptimized />
        </div>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
          />
          <Button onClick={confirmCode} loading={isPending}>
            Verify
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="secondary" onClick={startSetup} loading={isPending}>
      <ShieldCheck className="h-4 w-4" /> Set up two-factor authentication
    </Button>
  );
}
