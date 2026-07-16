import { api, getApiBaseUrl, useApiMutation, useApiQuery } from "@config";
import { useMutation } from "@tanstack/react-query";
import { Company, UpdateCompanyResponse, HierarchyConfig, UpdateHierarchyConfigRequest, CompanyRole, CompanyRoleRequest, Permission } from "./types";

export const useGetCompany = ( companyId: Company['id'] ) => {
  return useApiQuery<Company>(['company'], `companies/${companyId}`);
}

export const useUpdateCompany = (companyId: Company['id']) => {
  return useApiMutation<UpdateCompanyResponse, Partial<Company>>(`companies/${companyId}`, 'patch');
};

export const useUploadCompanyLogo = (companyId: Company['id']) => {
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.postFormData<Company>(`companies/${companyId}/logo`, formData);
    },
  });

  const uploadLogo = (
    file: File,
    onSuccess?: (data: Company) => void
  ) => {
    mutation.mutate(file, { onSuccess });
  };

  return [uploadLogo, mutation.isPending, mutation.error, mutation.data] as const;
};

export const getCompanyLogoUrl = (companyLogo: string | null | undefined): string => {
  if (!companyLogo) return '';
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const path = companyLogo.startsWith('uploads/') ? companyLogo : `uploads/${companyLogo}`;
  return `${baseUrl}/${path}`;
};

export const useGetHierarchyConfig = (companyId: Company['id']) => {
  return useApiQuery<HierarchyConfig>(['hierarchy-config', companyId], `companies/${companyId}/hierarchy-config`);
};

export const useUpdateHierarchyConfig = (companyId: Company['id']) => {
  return useApiMutation<HierarchyConfig, UpdateHierarchyConfigRequest>(`companies/${companyId}/hierarchy-config`, 'patch');
};

export const useGetPermissions = () => {
  return useApiQuery<Permission[]>(["access", "permissions"], "access/permissions");
};

export const useGetCompanyRoles = () => {
  return useApiQuery<CompanyRole[]>(["access", "roles"], "access/roles");
};

export const useCreateCompanyRole = () => {
  return useApiMutation<{ data: CompanyRole }, CompanyRoleRequest>("access/roles", "post");
};

export const useUpdateCompanyRole = (roleId: number) => {
  return useApiMutation<{ data: CompanyRole }, Partial<CompanyRoleRequest>>(`access/roles/${roleId}`, "patch");
};

export const useDeleteCompanyRole = (roleId: number) => {
  return useApiMutation<{ message: string }, void>(`access/roles/${roleId}`, "delete");
};
