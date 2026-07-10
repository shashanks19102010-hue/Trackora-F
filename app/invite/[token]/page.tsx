import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { InviteResponseButtons } from "@/components/people/invite-response-buttons";

export default async function InviteTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in yet — send them to sign up, then straight back to this
  // exact link so they land right back here to accept.
  if (!user) {
    redirect(`/signup?redirectedFrom=/invite/${params.token}`);
  }

  const { data, error } = await supabase.rpc("get_invite_by_token", { p_token: params.token });
  const invite = data?.[0];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-12 text-fog">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-signal/20 blur-[140px]"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={28} />
          <span className="font-display text-xl font-semibold tracking-tight">TRACKORA</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 text-center shadow-2xl">
          {!invite || error ? (
            <>
              <h1 className="font-display text-xl font-semibold">Invite not found</h1>
              <p className="mt-2 text-sm text-steel">This link is invalid, expired, or has already been used.</p>
              <Button asChild className="mt-6">
                <Link href="/map">Go to your map</Link>
              </Button>
            </>
          ) : invite.status !== "pending" ? (
            <>
              <h1 className="font-display text-xl font-semibold">Already handled</h1>
              <p className="mt-2 text-sm text-steel">This invite has already been responded to.</p>
              <Button asChild className="mt-6">
                <Link href="/map">Go to your map</Link>
              </Button>
            </>
          ) : invite.owner_id === user.id ? (
            <>
              <h1 className="font-display text-xl font-semibold">That's your own invite</h1>
              <p className="mt-2 text-sm text-steel">Share this link with someone else to connect with them.</p>
              <Button asChild className="mt-6">
                <Link href="/people">Back to People</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold">
                {invite.owner_name} wants to share locations with you
              </h1>
              <p className="mt-2 text-sm text-steel">
                Saved as "{invite.label}" ({invite.relationship}). You'll only see each other's location if you
                accept — and you can revoke this anytime.
              </p>
              <InviteResponseButtons token={params.token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
