export interface DashboardSummary {
  productsSoldToday: number;
  salesToday: number;
  newCustomersThisMonth: number;
  pendingInvoices: number;
}

export interface TopProduct {
  productId: number;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface MonthlySalesProfit {
  month: string;
  sales: number;
  profit: number;
}

export interface WeeklySales {
  day: number;
  sales: number;
}

export interface DashboardRanking {
  id: number;
  name: string;
  sales: number;
}

export interface TopDepartment extends DashboardRanking {
  code: string;
}

export interface PaymentMethodSales {
  id: number;
  name: string;
  code: string;
  sales: number;
}
