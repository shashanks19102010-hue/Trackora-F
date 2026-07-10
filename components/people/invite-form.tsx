"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Copy, Check, Link2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { createInviteAction } from "@/app/(dashboard)/people/actions";

const RELATIONSHIPS = [
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

export function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relationship, setRelationship] = useState("family");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  function handleSubmit(formData: FormData) {
    formData.set("relationship", relationship);
    setErrors({});
    setGeneratedLink(null);
    startTransition(async () => {
      const result = await createInviteAction(formData);
      if (result.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const k in result.fieldErrors) flat[k] = result.fieldErrors[k]?.[0] ?? "";
        setErrors(flat);
      }
      if (result.success && result.link) {
        setGeneratedLink(result.link);
      } else if (!result.success) {
        toast({ title: "Couldn't create invite", description: result.message, variant: "error" });
      }
    });
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: "Link copied", description: "Paste it into WhatsApp, SMS, email — wherever.", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-signal" /> Invite someone
        </CardTitle>
        <CardDescription>
          Generate a link and send it however you like. They only appear on your map after they open it and accept.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="invite-form" action={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="label">Name</Label>
            <Input id="label" name="label" placeholder="e.g. Mom, Arjun, Team lead" required error={errors.label} />
            {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {RELATIONSHIPS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRelationship(r.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    relationship === r.value ? "bg-signal text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={isPending}>
              <Link2 className="h-4 w-4" /> Generate invite link
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {generatedLink && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-signal/30 bg-signal/5 p-3">
                <input
                  readOnly
                  value={generatedLink}
                  className="mono-readout flex-1 truncate bg-transparent outline-none"
                  onFocus={(e) => e.target.select()}
                />
                <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
