export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)] disabled:pointer-events-none disabled:opacity-60";

const intents: Record<ButtonIntent, string> = {
  primary:
    "bg-[var(--showman-orange)] text-[#160b02] hover:bg-[var(--showman-orange-strong)]",
  secondary:
    "border border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)] hover:bg-[rgba(255,248,236,0.09)]",
  ghost:
    "text-[var(--showman-muted)] hover:text-[var(--showman-bone)] hover:bg-[rgba(255,248,236,0.06)]",
  danger:
    "border border-[rgba(255,92,122,0.45)] bg-transparent text-[var(--showman-danger)] hover:bg-[rgba(255,92,122,0.1)]",
};

export function buttonStyles(intent: ButtonIntent = "primary"): string {
  return `${base} ${intents[intent]}`;
}
