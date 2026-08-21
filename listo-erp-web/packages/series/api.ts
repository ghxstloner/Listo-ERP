import { useApiMutation, useApiQuery } from "@config";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/packages/config";
import type { Series, CreateSeriesRequest, UpdateSeriesRequest } from "./types";
import type { SeriesModule } from "./constants";

export const useGetSeries = () => {
  return useApiQuery<Series[]>(["series"], "series");
};

export const useGetSeriesById = (id: Series["id"]) => {
  return useApiQuery<Series>(["series", id], `series/${id}`);
};

export const useGetActiveSeries = (module: SeriesModule) => {
  const query = useQuery<Series | null, Error>({
    queryKey: ["series", "active", module],
    queryFn: async () => {
      const result = await api.get<Series | null>(`series/active/${module}`);
      return result ?? null;
    },
  });
  return [query.data, query.isLoading, query.error, query] as const;
};

export const useCreateSeries = () => {
  return useApiMutation<Series, CreateSeriesRequest>("series", "post");
};

export const useUpdateSeries = (id: Series["id"]) => {
  return useApiMutation<Series, UpdateSeriesRequest>(`series/${id}`, "patch");
};

export const useDeleteSeries = (id: Series["id"]) => {
  return useApiMutation<void, void>(`series/${id}`, "delete");
};
