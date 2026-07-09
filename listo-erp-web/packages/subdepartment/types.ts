import type { Department } from "../department/types";

export interface SubDepartment {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  sortOrder: number;
  isActive: boolean;
  department: Pick<Department, "id" | "name" | "code" | "companyId">;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubDepartmentRequest {
  name: string;
  code: string;
  departmentId: number;
  isActive: boolean;
}

export type UpdateSubDepartmentRequest = Partial<CreateSubDepartmentRequest>;

export interface SubDepartmentsResponseMeta {
  entityName: string;
  level: number;
}

export interface SubDepartmentsResponse {
  data: SubDepartment[];
  meta: SubDepartmentsResponseMeta;
}
