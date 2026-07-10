import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-12">
      {/* Ambient signal glow — signature background treatment */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-signal/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-mint/10 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={28} />
          <span className="font-display text-xl font-semibold tracking-tight text-fog">TRACKORA</span>
        </Link>
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
