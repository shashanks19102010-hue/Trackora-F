import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void text-center text-fog">
      <p className="mono-readout">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">This page doesn't exist</h1>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
