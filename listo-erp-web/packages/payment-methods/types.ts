export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  image: string | null;
  requiresReference: boolean;
  isActive: boolean;
  companyId: number;
}

export interface PaymentMethodRequest {
  name: string;
  code: string;
  requiresReference: boolean;
  isActive: boolean;
}

export interface PaymentMethodResponse {
  message: string;
  data: PaymentMethod;
}
