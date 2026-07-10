"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { respondToInviteByTokenAction } from "@/app/(dashboard)/people/actions";

export function InviteResponseButtons({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function respond(action: "accept" | "decline") {
    startTransition(async () => {
      const result = await respondToInviteByTokenAction(token, action);
      if (!result.success) {
        toast({ title: "Couldn't process invite", description: result.message, variant: "error" });
        return;
      }
      toast({
        title: action === "accept" ? "Connected" : "Invite declined",
        description: action === "accept" ? "You can now see each other's location." : undefined,
        variant: "success",
      });
      router.push(action === "accept" ? "/map" : "/people");
    });
  }

  return (
    <div className="mt-6 flex justify-center gap-3">
      <Button loading={isPending} onClick={() => respond("accept")}>
        <Check className="h-4 w-4" /> Accept
      </Button>
      <Button variant="outline" loading={isPending} onClick={() => respond("decline")}>
        <X className="h-4 w-4" /> Decline
      </Button>
    </div>
  );
}
