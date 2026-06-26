export type BadgeTone = "default" | "orange" | "open" | "blocked" | "muted";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

const tones: Record<BadgeTone, string> = {
  default:
    "border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)]",
  orange:
    "border-[rgba(255,122,26,0.45)] bg-[rgba(255,122,26,0.14)] text-[#ffb06a]",
  open:
    "border-[rgba(110,231,168,0.45)] bg-[rgba(110,231,168,0.12)] text-[var(--showman-success)]",
  blocked:
    "border-[rgba(255,92,122,0.45)] bg-[rgba(255,92,122,0.12)] text-[var(--showman-danger)]",
  muted:
    "border-[var(--showman-line)] bg-transparent text-[var(--showman-muted)]",
};

export function badgeStyles(tone: BadgeTone = "default"): string {
  return `${base} ${tones[tone]}`;
}
