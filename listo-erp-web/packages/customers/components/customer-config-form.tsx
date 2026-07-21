"use client";

import type { Customer } from "@/packages/customers/types";
import { CustomerForm } from "./customer-form";

interface CustomerConfigFormProps {
  customer: Customer;
  customerId: number;
}

export function CustomerConfigForm({ customer, customerId }: CustomerConfigFormProps) {
  void customerId;
  return <CustomerForm customer={customer} />;
}
