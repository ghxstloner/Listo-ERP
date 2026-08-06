import { api, useApiMutation } from "@config";
import { useQuery } from "@tanstack/react-query";
import type {
  ColombiaElectronicInvoicingConfiguration,
  TillColombiaElectronicInvoicingConfiguration,
  UpdateColombiaElectronicInvoicingConfigurationRequest,
  UpdateColombiaElectronicInvoicingConfigurationResponse,
  UpdateTillColombiaElectronicInvoicingConfigurationRequest,
  UpdateTillColombiaElectronicInvoicingConfigurationResponse,
} from "./types";

const colombiaConfigurationEndpoint =
  "electronic-invoicing/configuration/colombia";

export const useGetColombiaElectronicInvoicingConfiguration = () => {
  const query = useQuery<
    ColombiaElectronicInvoicingConfiguration | null,
    Error
  >({
    queryKey: ["electronic-invoicing", "configuration", "colombia"],
    queryFn: async () =>
      (await api.get<ColombiaElectronicInvoicingConfiguration | undefined>(
        colombiaConfigurationEndpoint,
      )) ?? null,
  });

  return [query.data ?? null, query.isLoading, query.error, query] as const;
};

export const useUpdateColombiaElectronicInvoicingConfiguration = () =>
  useApiMutation<
    UpdateColombiaElectronicInvoicingConfigurationResponse,
    UpdateColombiaElectronicInvoicingConfigurationRequest
  >(colombiaConfigurationEndpoint, "put");

const tillColombiaConfigurationEndpoint = (tillId: number) =>
  `electronic-invoicing/tills/${tillId}/colombia`;

export const useGetTillColombiaElectronicInvoicingConfiguration = (
  tillId: number | null,
) => {
  const query = useQuery<
    TillColombiaElectronicInvoicingConfiguration | null,
    Error
  >({
    queryKey: ["electronic-invoicing", "till", tillId, "colombia"],
    enabled: tillId !== null,
    queryFn: async () =>
      (await api.get<
        TillColombiaElectronicInvoicingConfiguration | undefined
      >(tillColombiaConfigurationEndpoint(tillId!))) ?? null,
  });

  return [query.data ?? null, query.isLoading, query.error, query] as const;
};

export const useUpdateTillColombiaElectronicInvoicingConfiguration = (
  tillId: number,
) =>
  useApiMutation<
    UpdateTillColombiaElectronicInvoicingConfigurationResponse,
    UpdateTillColombiaElectronicInvoicingConfigurationRequest
  >(tillColombiaConfigurationEndpoint(tillId), "put");
