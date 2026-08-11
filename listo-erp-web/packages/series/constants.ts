export const SERIES_MODULES = ["ORDERS"] as const;
export type SeriesModule = (typeof SERIES_MODULES)[number];
