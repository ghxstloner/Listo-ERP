import { useApiMutation, useApiQuery } from "@config";
import type { Series, CreateSeriesRequest, UpdateSeriesRequest } from "./types";
import type { SeriesModule } from "./constants";

export const useGetSeries = () => {
  return useApiQuery<Series[]>(["series"], "series");
};

export const useGetSeriesById = (id: Series["id"]) => {
  return useApiQuery<Series>(["series", id], `series/${id}`);
};

export const useGetActiveSeries = (module: SeriesModule) => {
  return useApiQuery<Series | null>(
    ["series", "active", module],
    `series/active/${module}`,
  );
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
