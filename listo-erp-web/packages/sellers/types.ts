export interface SellerUserAssignment {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export interface Seller {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  sellerUsers: SellerUserAssignment[];
}

export interface CreateSellerRequest {
  code: string;
  name: string;
  isActive: boolean;
  userIds: number[];
}

export type UpdateSellerRequest = Partial<Omit<CreateSellerRequest, "userIds">>;

export interface AssignSellerUsersRequest {
  userIds: number[];
}
