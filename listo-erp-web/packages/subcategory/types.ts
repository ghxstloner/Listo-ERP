import type { Department } from "../department/types";
import type { SubDepartment } from "../subdepartment/types";

export interface SubCategory {
  id: number;
  name: string;
  code: string;
  categoryId: number;
  sortOrder: number;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    code: string;
    subdepartmentId: number;
    subdepartment: Pick<SubDepartment, "id" | "name" | "code" | "departmentId"> & {
      department: Pick<Department, "id" | "name" | "code" | "companyId">;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubCategoryRequest {
  name: string;
  code: string;
  categoryId: number;
  isActive: boolean;
}

export type UpdateSubCategoryRequest = Partial<CreateSubCategoryRequest>;

export interface SubCategoriesResponseMeta {
  entityName: string;
  level: number;
}

export interface SubCategoriesResponse {
  data: SubCategory[];
  meta: SubCategoriesResponseMeta;
}
