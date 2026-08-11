export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  dianCode: string | null;
  image: string | null;
  isActive: boolean;
  companyId: number;
}

export interface PaymentMethodRequest {
  name: string;
  code: string;
  dianCode: string | null;
  isActive: boolean;
}

export interface PaymentMethodResponse {
  message: string;
  data: PaymentMethod;
}
