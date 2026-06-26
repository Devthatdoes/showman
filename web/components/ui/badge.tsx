export type BadgeTone = "default" | "orange" | "open" | "blocked" | "muted";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em]";

const tones: Record<BadgeTone, string> = {
  default:
    "border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)]",
  orange:
    "border-[rgba(255,122,26,0.45)] bg-[rgba(255,122,26,0.14)] text-[#ffb06a]",
  open:
    "border-[rgba(110,231,168,0.42)] bg-[rgba(110,231,168,0.11)] text-[#a9ffd0]",
  blocked:
    "border-[rgba(255,122,26,0.38)] bg-[rgba(255,122,26,0.1)] text-[#ffb06a]",
  muted:
    "border-[var(--showman-line)] bg-transparent text-[var(--showman-muted)]",
};

export function badgeStyles(tone: BadgeTone = "default"): string {
  return `${base} ${tones[tone]}`;
}
