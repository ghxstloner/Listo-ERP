import { api, useApiMutation, useApiQuery } from "@config";
import { useQuery } from "@tanstack/react-query";
import type {
  ApiMessageResponse,
  CashSession,
  CashSessionStatus,
  CashSessionTill,
  CloseCashSessionRequest,
  OpenCashSessionRequest,
} from "./types";

export const useGetCashSessions = (status?: CashSessionStatus | "all") => {
  const params =
    status && status !== "all" ? { params: { status } } : undefined;
  return useApiQuery<CashSession[]>(
    ["cash-sessions", status ?? "all"],
    "cash-sessions",
    params,
  );
};

export const useGetCurrentCashSession = () => {
  const query = useQuery<CashSession | null, Error>({
    queryKey: ["cash-sessions", "current"],
    // Nest sends an empty response when the current session is null.
    queryFn: async () =>
      (await api.get<CashSession | null>("cash-sessions/current")) ?? null,
  });

  return [query.data, query.isLoading, query.error, query] as const;
};

export const useGetAvailableCashSessionTills = () => {
  return useApiQuery<CashSessionTill[]>(
    ["cash-sessions", "available-tills"],
    "cash-sessions/available-tills",
  );
};

export const useOpenCashSession = () => {
  return useApiMutation<
    ApiMessageResponse<CashSession>,
    OpenCashSessionRequest
  >("cash-sessions/open", "post");
};

export const useCloseCashSession = (id: CashSession["id"]) => {
  return useApiMutation<
    ApiMessageResponse<CashSession>,
    CloseCashSessionRequest
  >(`cash-sessions/${id}/close`, "post");
};
