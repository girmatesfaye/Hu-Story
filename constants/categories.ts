export const RANT_CATEGORIES = [
  "Campus Life",
  "Cafeteria",
  "Academics",
  "Dorms",
  "Relationships",
  "Sexual",
  "Mental",
  "Family",
  "Other",
] as const;

export const RANT_FILTER_CHIPS = ["All Rants", ...RANT_CATEGORIES] as const;

export const SPOT_CATEGORIES = [
  "Food",
  "Hangout",
  "Game",
  "Study",
  "Date Spots",
  "Quiet Areas",
  "Outdoor",
  "Cheap Eats",
  "Other",
] as const;

export const SPOT_FILTER_CATEGORIES = ["All", ...SPOT_CATEGORIES] as const;
