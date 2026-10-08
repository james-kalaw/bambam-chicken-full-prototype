import { Mascot } from "./mascot";

/** Full-screen loading state. A cooking animation can replace this later. */
export function MascotLoading({ label = "Heating up the fryer…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bambam-cream">
      <Mascot mood="hungry" size="lg" className="animate-bob" priority />
      <p className="font-display text-lg font-semibold text-bambam-brown">{label}</p>
    </div>
  );
}
