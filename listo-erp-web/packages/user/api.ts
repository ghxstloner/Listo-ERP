import { useApiMutation, useApiQuery } from "@config";
import type { CreateUserRequest, DeleteUserResponse, UpdateUserRequest, User } from "./types";

export const useCreateUser = () => {
  return useApiMutation<User, CreateUserRequest>('users', 'post');
};

export const useGetUsers = () => {
  return useApiQuery<User[]>(['users'], 'users');
};

export const useGetUser = (userId: User['id']) => {
  return useApiQuery<User>(['user', userId], `users/${userId}`);
};

export const useUpdateUser = (userId: User['id']) => {
  return useApiMutation<User, UpdateUserRequest>(`users/${userId}`, 'patch');
};

export const useDeleteUser = (userId: User['id']) => {
  return useApiMutation<DeleteUserResponse, void>(`users/${userId}`, 'delete');
};
