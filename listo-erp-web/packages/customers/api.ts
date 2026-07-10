import { useApiMutation, useApiQuery } from "@config";
import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from "./types";

export const useCreateCustomer = () => {
  return useApiMutation<Customer, CreateCustomerRequest>("customers", "post");
};

export const useGetCustomers = () => {
  return useApiQuery<Customer[]>(["customers"], "customers");
};

export const useGetCustomer = (id: Customer["id"]) => {
  return useApiQuery<Customer>(["customers", id], `customers/${id}`);
};

export const useUpdateCustomer = (id: Customer["id"]) => {
  return useApiMutation<Customer, UpdateCustomerRequest>(`customers/${id}`, "patch");
};

export const useDeleteCustomer = (id: Customer["id"]) => {
  return useApiMutation<void, void>(`customers/${id}`, "delete");
};
