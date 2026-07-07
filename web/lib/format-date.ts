// Availability dates are stored as plain YYYY-MM-DD strings with no timezone.
// Formatting pins noon UTC so the rendered day can't shift across timezones.
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
