export interface User {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Array<{ id: number; name: string }>;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  roleIds?: number[];
  isActive?: boolean;
}

export interface DeleteUserResponse {
  message: string;
}
