export type CompanyUserRole = 'ADMIN' | 'USER';

export interface CompanyUser {
  id: number;
  userId: number;
  companyId: number;
  role: CompanyUserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySummary {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}


export interface CompanyUserWithCompany extends CompanyUser {
  company: CompanySummary;
}


export interface CompanyUserWithUser extends CompanyUser {
  user: UserSummary;
}


export interface CreateCompanyUserRequest {
  userId: number;
  role: CompanyUserRole;
}

export interface UpdateCompanyUserRequest {
  role: CompanyUserRole;
}

export interface DeleteCompanyUserResponse {
  message: string;
}

