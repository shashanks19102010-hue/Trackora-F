"use client";

import { useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeConnectionAction } from "@/app/(dashboard)/people/actions";

interface Connection {
  id: string;
  label: string;
  status: string;
  relationship: string;
  connected_user_id?: string | null;
  owner?: { full_name: string } | null;
}

export function ConnectionsList({
  title,
  connections,
  variant,
  onNavigateTo,
}: {
  title: string;
  connections: Connection[];
  variant: "incoming" | "outgoing";
  onNavigateTo?: (userId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (connections.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      <div className="space-y-2">
        <AnimatePresence>
          {connections.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-panel flex items-center justify-between rounded-xl p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {variant === "incoming" ? c.owner?.full_name ?? "Someone" : c.label}
                </p>
                <p className="mono-readout capitalize">
                  {c.relationship} · {c.status}
                </p>
              </div>

              {variant === "outgoing" && c.status === "accepted" && (
                <div className="flex gap-2">
                  {onNavigateTo && c.connected_user_id && (
                    <Button size="sm" variant="secondary" onClick={() => onNavigateTo(c.connected_user_id!)}>
                      <Navigation className="h-4 w-4" /> Directions
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startTransition(() => revokeConnectionAction(c.id))}
                  >
                    <Ban className="h-4 w-4" /> Revoke
                  </Button>
                </div>
              )}

              {variant === "outgoing" && c.status === "pending" && (
                <span className="mono-readout">awaiting response</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
