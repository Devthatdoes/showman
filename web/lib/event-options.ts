// Shared between the standalone event form and the request brief form so the
// two selects can't drift apart; the values are what bookerEvents rows store.
export const EVENT_TYPE_OPTIONS = [
  { value: "show", label: "Show" },
  { value: "festival", label: "Festival" },
  { value: "club", label: "Club" },
  { value: "private", label: "Private" },
  { value: "brand", label: "Brand" },
] as const;

export const CAPACITY_BAND_OPTIONS = [
  { value: "<500", label: "<500" },
  { value: "500-2k", label: "500-2k" },
  { value: "2k-10k", label: "2k-10k" },
  { value: "10k+", label: "10k+" },
] as const;
