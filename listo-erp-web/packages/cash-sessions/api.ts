import { useApiMutation, useApiQuery } from "@config";
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
  return useApiQuery<CashSession | null>(
    ["cash-sessions", "current"],
    "cash-sessions/current",
  );
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
