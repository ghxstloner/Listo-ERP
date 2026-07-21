import { api, useApiMutation } from "@config";
import { useQuery } from "@tanstack/react-query";
import type {
  ColombiaElectronicInvoicingConfiguration,
  UpdateColombiaElectronicInvoicingConfigurationRequest,
  UpdateColombiaElectronicInvoicingConfigurationResponse,
} from "./types";

const colombiaConfigurationEndpoint =
  "electronic-invoicing/configuration/colombia";

export const useGetColombiaElectronicInvoicingConfiguration = () => {
  const query = useQuery<
    ColombiaElectronicInvoicingConfiguration | null,
    Error
  >({
    queryKey: ["electronic-invoicing", "configuration", "colombia"],
    // The first configuration read can be empty before an administrator saves it.
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
