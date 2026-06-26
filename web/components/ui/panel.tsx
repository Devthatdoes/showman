export type PanelTone = "default" | "subtle" | "elevated";

const base = "border border-[var(--showman-line)]";

const tones: Record<PanelTone, string> = {
  default: "rounded-2xl bg-[rgba(17,16,14,0.78)]",
  subtle: "rounded-2xl bg-[rgba(255,248,236,0.035)]",
  elevated: "rounded-3xl bg-[rgba(17,16,14,0.9)] shadow-2xl shadow-black/30",
};

export function panelStyles(tone: PanelTone = "default"): string {
  return `${base} ${tones[tone]}`;
}
