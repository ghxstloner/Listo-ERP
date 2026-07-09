import { useApiMutation, useApiQuery } from "@config";
import type { SubCategory, CreateSubCategoryRequest, UpdateSubCategoryRequest, SubCategoriesResponse } from "./types";

export const useCreateSubCategory = () => {
  return useApiMutation<SubCategory, CreateSubCategoryRequest>("subcategories", "post");
};

export const useGetSubCategories = (categoryId?: number) => {
  return useApiQuery<SubCategoriesResponse>(
    ["subcategories", categoryId], 
    "subcategories",
    {
      params: categoryId !== undefined ? { categoryId } : undefined
    }
  );
};

export const useGetSubCategory = (id: SubCategory["id"]) => {
  return useApiQuery<SubCategory>(["subcategories", id], `subcategories/${id}`);
};

export const useUpdateSubCategory = (id: SubCategory["id"]) => {
  return useApiMutation<SubCategory, UpdateSubCategoryRequest>(`subcategories/${id}`, "patch");
};

export const useDeleteSubCategory = (id: SubCategory["id"]) => {
  return useApiMutation<void, void>(`subcategories/${id}`, "delete");
};
