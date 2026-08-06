export type ElectronicInvoicingEnvironment = "DEMO" | "PRODUCTION";
export type ElectronicInvoicingNumberingMode = "WITH_PREFIX" | "WITHOUT_PREFIX";

export interface ColombiaElectronicInvoicingConfiguration {
  id: number;
  countryCode: "CO";
  environment: ElectronicInvoicingEnvironment;
  providerBaseUrl: string | null;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateColombiaElectronicInvoicingConfigurationRequest {
  environment?: ElectronicInvoicingEnvironment;
  providerBaseUrl?: string;
  tokenEmpresa?: string;
  tokenPassword?: string;
}

export interface UpdateColombiaElectronicInvoicingConfigurationResponse {
  message: string;
  data: ColombiaElectronicInvoicingConfiguration;
}

export interface TillColombiaElectronicInvoicingConfiguration {
  id: number;
  tillId: number;
  companyId: number;
  countryCode: "CO";
  numberingMode: ElectronicInvoicingNumberingMode;
  numberingRange: string;
  nextConsecutive: number;
  providerNumberingId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTillColombiaElectronicInvoicingConfigurationRequest {
  numberingMode?: ElectronicInvoicingNumberingMode;
  rangoNumeracion?: string;
  nextConsecutive?: number;
}

export interface UpdateTillColombiaElectronicInvoicingConfigurationResponse {
  message: string;
  data: TillColombiaElectronicInvoicingConfiguration;
}
