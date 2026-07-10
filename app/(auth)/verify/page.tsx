import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage({ searchParams }: { searchParams: { redirectedFrom?: string } }) {
  const redirectedFrom = searchParams?.redirectedFrom ?? "";
  const loginHref = `/login${redirectedFrom ? `?redirectedFrom=${encodeURIComponent(redirectedFrom)}` : ""}`;

  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-mint" />
      <h1 className="mt-4 font-display text-2xl font-semibold">Email verified</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your account is ready. Sign in to continue.</p>
      <Button asChild className="mt-6">
        <Link href={loginHref}>Continue to sign in</Link>
      </Button>
    </div>
  );
}
