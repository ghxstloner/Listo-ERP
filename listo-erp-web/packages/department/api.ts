import { useApiMutation, useApiQuery } from "@config";
import type { SubDepartment } from "../subdepartment/types";
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentsResponse } from "./types";

export const useCreateDepartment = () => {
  return useApiMutation<Department, CreateDepartmentRequest>("departments", "post");
};

export const useGetDepartments = (includeSubdepartments?: boolean) => {
  return useApiQuery<DepartmentsResponse>(
    ["departments", includeSubdepartments], 
    "departments",
    {
      params: includeSubdepartments !== undefined ? { includeSubdepartments } : undefined
    }
  );
};

export const useGetDepartment = (id: Department["id"]) => {
  return useApiQuery<Department>(["departments", id], `departments/${id}`);
};

export const useUpdateDepartment = (id: Department["id"]) => {
  return useApiMutation<Department, UpdateDepartmentRequest>(`departments/${id}`, "patch");
};

export const useDeleteDepartment = (id: Department["id"]) => {
  return useApiMutation<void, void>(`departments/${id}`, "delete");
};

export const useGetDepartmentSubDepartments = (id: Department["id"]) => {
  return useApiQuery<SubDepartment[]>(
    ["departments", id, "subdepartments"], 
    `departments/${id}/subdepartments`
  );
};
