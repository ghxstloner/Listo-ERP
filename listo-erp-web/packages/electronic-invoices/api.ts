import type { ElectronicInvoiceStatus } from "./types";

export type { ElectronicInvoiceStatus } from "./types";

export const useGetElectronicInvoices = (filters: {
  status?: ElectronicInvoiceStatus | "all";
  dateFrom?: string;
  dateTo?: string;
}) => {
  const params: Record<string, string | undefined> = {};
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  return {
    queryKey: ["electronic-invoices", filters.status ?? "all", filters.dateFrom ?? "", filters.dateTo ?? ""],
    endpoint: "sales",
    params: Object.keys(params).length > 0 ? params : undefined,
  };
};
