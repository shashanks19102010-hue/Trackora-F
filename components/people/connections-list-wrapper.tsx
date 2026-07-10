"use client";

import { useRouter } from "next/navigation";
import { ConnectionsList } from "@/components/people/connections-list";

interface Connection {
  id: string;
  label: string;
  status: string;
  relationship: string;
  connected_user_id?: string | null;
  owner?: { full_name: string } | null;
}

export function ConnectionsListWrapper({ incoming, outgoing }: { incoming: Connection[]; outgoing: Connection[] }) {
  const router = useRouter();

  function navigateTo(userId: string) {
    router.push(`/map?to=${userId}`);
  }

  return (
    <>
      <ConnectionsList title="Connected to you" connections={incoming} variant="incoming" />
      <ConnectionsList title="Your circle" connections={outgoing} variant="outgoing" onNavigateTo={navigateTo} />
    </>
  );
}
