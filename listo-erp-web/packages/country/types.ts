export interface TaxDocumentType {
  code: string;
  name: string;
  hasCheckDigit: boolean;
}

export interface Country {
  id: number;
  code: string;
  name: string;
  taxDocumentTypes: TaxDocumentType[];
  isActive: boolean;
}
