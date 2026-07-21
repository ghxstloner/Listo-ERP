export type ElectronicInvoicingEnvironment = "DEMO" | "PRODUCTION";
export type ElectronicInvoicingNumberingMode = "WITH_PREFIX" | "WITHOUT_PREFIX";

export interface ColombiaElectronicInvoicingConfiguration {
  id: number;
  countryCode: "CO";
  environment: ElectronicInvoicingEnvironment;
  providerBaseUrl: string | null;
  providerNumberingId: string | null;
  numberingMode: ElectronicInvoicingNumberingMode;
  numberingRange: string;
  nextConsecutive: number;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateColombiaElectronicInvoicingConfigurationRequest {
  environment?: ElectronicInvoicingEnvironment;
  numberingMode?: ElectronicInvoicingNumberingMode;
  providerBaseUrl?: string;
  tokenEmpresa?: string;
  tokenPassword?: string;
  rangoNumeracion?: string;
  nextConsecutive?: number;
}

export interface UpdateColombiaElectronicInvoicingConfigurationResponse {
  message: string;
  data: ColombiaElectronicInvoicingConfiguration;
}
