import { useApiMutation, useApiQuery } from "@config";
import type { Till } from "../till/types";
import type { Branch, CreateBranchRequest, UpdateBranchRequest } from "./types";

export const useCreateBranch = () => {
  return useApiMutation<Branch, CreateBranchRequest>("branches", "post");
};

export const useGetBranches = () => {
  return useApiQuery<Branch[]>(["branches"], "branches");
};

export const useGetBranchesByCompany = (companyId: number) => {
  return useApiQuery<Branch[]>(["branches", "company", companyId], "/branches");
};

export const useGetBranch = (id: Branch["id"]) => {
  return useApiQuery<Branch>(["branches", id], `branches/${id}`);
};

export const useGetBranchTills = (branchId: Branch["id"]) => {
  return useApiQuery<Till[]>(["branches", branchId, "tills"], `/branches/${branchId}/tills`);
};

export const useUpdateBranch = (id: Branch["id"]) => {
  return useApiMutation<Branch, UpdateBranchRequest>(`branches/${id}`, "patch");
};

export const useDeleteBranch = (id: Branch["id"]) => {
  return useApiMutation<void, void>(`branches/${id}`, "delete");
};
