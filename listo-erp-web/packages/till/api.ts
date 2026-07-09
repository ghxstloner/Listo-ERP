import { useApiMutation, useApiQuery } from "@config";
import type { CreateTillRequest, Till, UpdateTillRequest } from "./types";

export const useCreateTill = () => {
  return useApiMutation<Till, CreateTillRequest>("tills", "post");
};

export const useGetTills = (branchId?: number) => {
  const params = branchId !== undefined ? { params: { branchId } } : undefined;
  return useApiQuery<Till[]>(["tills", branchId ?? "all"], "tills", params);
};

export const useGetTill = (id: Till["id"]) => {
  return useApiQuery<Till>(["tills", id], `tills/${id}`);
};

export const useUpdateTill = (id: Till["id"]) => {
  return useApiMutation<Till, UpdateTillRequest>(`tills/${id}`, "patch");
};

export const useDeleteTill = (id: Till["id"]) => {
  return useApiMutation<void, void>(`tills/${id}`, "delete");
};
