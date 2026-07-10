"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("dashboard_error_boundary", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-signal" />
      <p className="font-medium">Something went wrong loading this page.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This has been logged. You can try again, or head back to the map.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
