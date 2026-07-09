import { api, useApiQuery } from "@config";
import type { Country } from "./types";

export function useGetCountries() {
  return useApiQuery<Country[]>(["countries"], "countries");
}

export async function getCountries(): Promise<Country[]> {
  return api.get<Country[]>("countries");
}
