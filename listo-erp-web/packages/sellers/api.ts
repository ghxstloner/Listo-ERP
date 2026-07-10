import { useApiMutation, useApiQuery } from "@config";
import type {
  AssignSellerUsersRequest,
  CreateSellerRequest,
  Seller,
  UpdateSellerRequest,
} from "./types";

export const useCreateSeller = () => {
  return useApiMutation<Seller, CreateSellerRequest>("sellers", "post");
};

export const useGetSellers = () => {
  return useApiQuery<Seller[]>(["sellers"], "sellers");
};

export const useGetSeller = (id: Seller["id"]) => {
  return useApiQuery<Seller>(["sellers", id], `sellers/${id}`);
};

export const useUpdateSeller = (id: Seller["id"]) => {
  return useApiMutation<Seller, UpdateSellerRequest>(`sellers/${id}`, "patch");
};

export const useAssignSellerUsers = (id: Seller["id"]) => {
  return useApiMutation<Seller, AssignSellerUsersRequest>(
    `sellers/${id}/users`,
    "patch",
  );
};

export const useDeleteSeller = (id: Seller["id"]) => {
  return useApiMutation<void, void>(`sellers/${id}`, "delete");
};
