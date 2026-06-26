export type BookingLocationOption = {
  value: string;
  label: string;
  country: string;
  region: string;
  searchText: string;
};

export type BookingLocationGroup = {
  continent: string;
  options: BookingLocationOption[];
};

export const BOOKING_LOCATION_GROUPS: BookingLocationGroup[] = [
  {
    continent: "North America",
    options: [
      {
        value: "na-us-new-york",
        label: "New York, NY",
        country: "United States",
        region: "Northeast",
        searchText: "new york ny united states northeast brooklyn manhattan",
      },
      {
        value: "na-us-los-angeles",
        label: "Los Angeles, CA",
        country: "United States",
        region: "West Coast",
        searchText: "los angeles la california united states west coast",
      },
      {
        value: "na-us-atlanta",
        label: "Atlanta, GA",
        country: "United States",
        region: "South",
        searchText: "atlanta georgia united states south",
      },
      {
        value: "na-ca-toronto",
        label: "Toronto, ON",
        country: "Canada",
        region: "Ontario",
        searchText: "toronto ontario canada",
      },
    ],
  },
  {
    continent: "Europe",
    options: [
      {
        value: "eu-uk-london",
        label: "London",
        country: "United Kingdom",
        region: "England",
        searchText: "london england united kingdom uk",
      },
      {
        value: "eu-de-berlin",
        label: "Berlin",
        country: "Germany",
        region: "Berlin",
        searchText: "berlin germany",
      },
      {
        value: "eu-fr-paris",
        label: "Paris",
        country: "France",
        region: "Ile-de-France",
        searchText: "paris france ile de france",
      },
      {
        value: "eu-nl-amsterdam",
        label: "Amsterdam",
        country: "Netherlands",
        region: "North Holland",
        searchText: "amsterdam netherlands holland",
      },
    ],
  },
  {
    continent: "Asia-Pacific",
    options: [
      {
        value: "ap-jp-tokyo",
        label: "Tokyo",
        country: "Japan",
        region: "Kanto",
        searchText: "tokyo japan kanto",
      },
      {
        value: "ap-kr-seoul",
        label: "Seoul",
        country: "South Korea",
        region: "Capital Area",
        searchText: "seoul south korea capital area",
      },
      {
        value: "ap-au-sydney",
        label: "Sydney",
        country: "Australia",
        region: "New South Wales",
        searchText: "sydney australia new south wales",
      },
    ],
  },
  {
    continent: "Global / Fly-in",
    options: [
      {
        value: "global-major-festivals",
        label: "Major festivals worldwide",
        country: "Global",
        region: "Fly-in",
        searchText: "global worldwide major festivals fly in",
      },
      {
        value: "global-case-by-case",
        label: "Worldwide, case by case",
        country: "Global",
        region: "Case by case",
        searchText: "global worldwide international case by case",
      },
    ],
  },
];

export const TRAVEL_POLICY_OPTIONS = [
  {
    value: "travel-covered-required",
    label: "Travel covered",
    description: "Accepting requests here when travel and stay are covered.",
  },
  {
    value: "case-by-case",
    label: "Case by case",
    description: "Open to the market, but terms depend on the request.",
  },
  {
    value: "local-or-routing-only",
    label: "Local / routing",
    description: "Only local dates or routing that already makes sense.",
  },
] as const;

export type TravelPolicyValue = (typeof TRAVEL_POLICY_OPTIONS)[number]["value"];
