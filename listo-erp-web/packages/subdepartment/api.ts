import { useApiMutation, useApiQuery } from "@config";
import type { Category } from "../category/types";
import type { SubDepartment, CreateSubDepartmentRequest, UpdateSubDepartmentRequest, SubDepartmentsResponse } from "./types";

export const useCreateSubDepartment = () => {
  return useApiMutation<SubDepartment, CreateSubDepartmentRequest>("subdepartments", "post");
};

export const useGetSubDepartments = (departmentId?: number) => {
  return useApiQuery<SubDepartmentsResponse>(
    ["subdepartments", departmentId], 
    "subdepartments",
    {
      params: departmentId !== undefined ? { departmentId } : undefined
    }
  );
};

export const useGetSubDepartment = (id: SubDepartment["id"]) => {
  return useApiQuery<SubDepartment>(["subdepartments", id], `subdepartments/${id}`);
};

export const useUpdateSubDepartment = (id: SubDepartment["id"]) => {
  return useApiMutation<SubDepartment, UpdateSubDepartmentRequest>(`subdepartments/${id}`, "patch");
};

export const useDeleteSubDepartment = (id: SubDepartment["id"]) => {
  return useApiMutation<void, void>(`subdepartments/${id}`, "delete");
};

export const useGetSubDepartmentCategories = (id: SubDepartment["id"]) => {
  return useApiQuery<Category[]>(
    ["subdepartments", id, "categories"], 
    `subdepartments/${id}/categories`
  );
};
