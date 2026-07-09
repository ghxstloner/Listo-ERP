import type { Department } from "../department/types";
import type { SubDepartment } from "../subdepartment/types";

export interface Category {
  id: number;
  name: string;
  code: string;
  subdepartmentId: number;
  sortOrder: number;
  isActive: boolean;
  subdepartment: Pick<SubDepartment, "id" | "name" | "code" | "departmentId"> & {
    department: Pick<Department, "id" | "name" | "code" | "companyId">;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  subdepartmentId: number;
  isActive: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface CategoriesResponseMeta {
  entityName: string;
  level: number;
}

export interface CategoriesResponse {
  data: Category[];
  meta: CategoriesResponseMeta;
}
