export type BriefChip = {
  label: string;
  tone: "signal" | "plain";
};

export type SceneCard = {
  name: string;
  role: string;
  caption: string;
  palette: string;
  devOnly: true;
};

export type WorkflowStep = {
  kicker: string;
  title: string;
  body: string;
};

export type AudienceDoor = {
  label: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
};

export const landingBrief = {
  prompt:
    "Need a high-energy act for a late-night room this fall. Budget approved.",
  chips: [
    { label: "scene fit", tone: "signal" },
    { label: "fall window", tone: "plain" },
    { label: "set length", tone: "plain" },
    { label: "budget approved", tone: "signal" },
    { label: "access gated", tone: "plain" },
    { label: "verified teams", tone: "signal" },
  ] satisfies BriefChip[],
  fragments: [
    "brief parsed",
    "team authority checked",
    "private details stay gated",
    "window request ready",
  ],
};

export const sceneCards = [
  {
    name: "Development visual 01",
    role: "development visual placeholder",
    caption: "A high-energy public teaser without booking details.",
    palette: "from-[#070707] via-[#18324a] to-[#ff6a00]",
    devOnly: true,
  },
  {
    name: "Development visual 02",
    role: "development visual placeholder",
    caption: "Raw scene texture, not production marketplace proof.",
    palette: "from-[#151515] via-[#5e5b65] to-[#ff2d1d]",
    devOnly: true,
  },
  {
    name: "Development visual 03",
    role: "development visual placeholder",
    caption: "Soft motion and pop-world signal, still privacy-safe.",
    palette: "from-[#041418] via-[#0b6472] to-[#ffb06a]",
    devOnly: true,
  },
] satisfies SceneCard[];

export const workflowSteps = [
  {
    kicker: "01",
    title: "Describe the gig",
    body: "Start with plain language: room, date, budget, set length, and the kind of energy the night needs.",
  },
  {
    kicker: "02",
    title: "Match real teams",
    body: "Showman turns messy intent into booking terms and routes the request toward authorized artist teams.",
  },
  {
    kicker: "03",
    title: "Request a window",
    body: "Availability stays controlled. Bookers ask for time, teams decide what becomes visible, held, or declined.",
  },
] satisfies WorkflowStep[];

export const audienceDoors = [
  {
    label: "Start a request",
    href: "/sign-up",
    eyebrow: "I am booking",
    title: "Bring the brief. Keep the terms clear.",
    body: "For promoters, curators, brands, and rooms trying to put the right artist in the right moment.",
  },
  {
    label: "Set up artist workspace",
    href: "/artists/new",
    eyebrow: "I am an artist or team",
    title: "Control what gets seen before anything gets sent.",
    body: "For artists, managers, and teams who need profile, authority, availability, and request flow in one place.",
  },
] satisfies AudienceDoor[];

export const trustPromises = [
  "Real artist identity and team authority",
  "Controlled access to sensitive booking details",
  "Availability windows that can become holds",
  "Rails ready for contracts and payments later",
];
