"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { updateProfileAction } from "@/app/(dashboard)/settings/actions";

export function ProfileForm({ fullName, avatarUrl }: { fullName: string; avatarUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      toast({
        title: result.success ? "Saved" : "Couldn't save",
        description: result.message,
        variant: result.success ? "success" : "error",
      });
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input id="avatarUrl" name="avatarUrl" defaultValue={avatarUrl} placeholder="https://..." />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" loading={isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
