import { api, getApiBaseUrl, useApiQuery } from "@config";
import type { PaymentMethod } from "./types";

export const useGetPaymentMethods = () =>
  useApiQuery<PaymentMethod[]>(["payment-methods"], "payment-methods");

export const getPaymentMethodImageUrl = (
  image: string | null | undefined,
) => {
  if (!image) return "";
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const path = image.startsWith("uploads/") ? image : `uploads/${image}`;
  return `${baseUrl}/${path}`;
};

export const uploadPaymentMethodImage = (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.postFormData<PaymentMethod>(`payment-methods/${id}/image`, formData);
};
