export interface Department {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  isActive: boolean;
}

export type UpdateDepartmentRequest = Partial<CreateDepartmentRequest>;

export interface DepartmentsResponseMeta {
  entityName: string;
  level: number;
}

export interface DepartmentsResponse {
  data: Department[];
  meta: DepartmentsResponseMeta;
}
