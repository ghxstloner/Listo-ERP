import { useApiMutation, useApiQuery } from "@config";
import type {
  CompanyUser,
  CompanyUserWithCompany,
  CompanyUserWithUser,
  CreateCompanyUserRequest,
  DeleteCompanyUserResponse,
  UpdateCompanyUserRequest,
} from "./types";


export const useCreateCompanyUser = () => {
  return useApiMutation<CompanyUser, CreateCompanyUserRequest>("companies-users", "post");
};

export const useGetMyCompanies = () => {
  return useApiQuery<CompanyUserWithCompany[]>(["companies-users", "my-companies"], "companies-users/my-companies");
};


export const useGetCompanyUser = (id: CompanyUser["id"]) => {
  return useApiQuery<CompanyUser>(["companies-users", id], `companies-users/${id}`);
};

export const useUpdateCompanyUser = (id: CompanyUser["id"]) => {
  return useApiMutation<CompanyUser, UpdateCompanyUserRequest>(`companies-users/${id}`, "patch");
};

export const useGetCompanyUsersByCompany = (companyId: number) => {
  return useApiQuery<CompanyUserWithUser[]>(
    ["companies-users", "company", companyId],
    `companies-users/company/${companyId}`
  );
};

export const useDeleteCompanyUser = (id: CompanyUser["id"]) => {
  return useApiMutation<DeleteCompanyUserResponse, void>(`companies-users/${id}`, "delete");
};

