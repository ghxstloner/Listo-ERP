import { useApiMutation, useApiQuery } from "@config";
import type { SubCategory } from "../subcategory/types";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoriesResponse } from "./types";

export const useCreateCategory = () => {
  return useApiMutation<Category, CreateCategoryRequest>("categories", "post");
};

export const useGetCategories = (subdepartmentId?: number) => {
  return useApiQuery<CategoriesResponse>(
    ["categories", subdepartmentId], 
    "categories",
    {
      params: subdepartmentId !== undefined ? { subdepartmentId } : undefined
    }
  );
};

export const useGetCategory = (id: Category["id"]) => {
  return useApiQuery<Category>(["categories", id], `categories/${id}`);
};

export const useUpdateCategory = (id: Category["id"]) => {
  return useApiMutation<Category, UpdateCategoryRequest>(`categories/${id}`, "patch");
};

export const useDeleteCategory = (id: Category["id"]) => {
  return useApiMutation<void, void>(`categories/${id}`, "delete");
};

export const useGetCategorySubCategories = (id: Category["id"]) => {
  return useApiQuery<SubCategory[]>(
    ["categories", id, "subcategories"], 
    `categories/${id}/subcategories`
  );
};
