import Link from "next/link";
import { ArrowRight, Users, ShieldCheck, Sparkles, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSignal } from "@/components/landing/hero-signal";
import { Logo } from "@/components/layout/logo";

const FEATURES = [
  {
    icon: Users,
    title: "Invite, don't intrude",
    body: "Nobody appears on your map until they accept. Revoke access in one tap, anytime.",
  },
  {
    icon: Radar,
    title: "Live, not laggy",
    body: "Positions update the instant they change, streamed over a realtime connection.",
  },
  {
    icon: ShieldCheck,
    title: "Built to protect",
    body: "Row-level security, encrypted sessions, and optional two-factor authentication.",
  },
  {
    icon: Sparkles,
    title: "ORI, on call",
    body: "An assistant that knows the app inside out, for when something doesn't work.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void text-fog">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-display text-lg font-semibold tracking-tight">TRACKORA</span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-signal/15 blur-[160px]"
        />
        <span className="mono-readout relative rounded-full border border-glass-border px-3 py-1">
          CONSENT-BASED LOCATION SHARING
        </span>
        <h1 className="relative mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Know where it matters. <span className="text-signal">Only when they say yes.</span>
        </h1>
        <p className="relative mt-5 max-w-xl text-balance text-steel">
          TRACKORA connects the people you trust through real invites, real consent, and a map that updates
          in real time — nothing hidden, nothing assumed.
        </p>
        <div className="relative mt-8 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">I have an account</Link>
          </Button>
        </div>

        <HeroSignal />
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass-panel rounded-2xl p-6 text-left">
            <Icon className="h-6 w-6 text-signal" />
            <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-steel">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-glass-border px-6 py-8 text-center text-xs text-steel">
        © {new Date().getFullYear()} TRACKORA. Built for the people who trust each other.
      </footer>
    </div>
  );
}
