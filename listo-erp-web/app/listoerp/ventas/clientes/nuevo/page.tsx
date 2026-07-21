"use client";

import { usePageTitle } from "@/lib/page-title-context";
import { CustomerForm } from "@/packages/customers/components/customer-form";
import { useEffect } from "react";

export default function NewCustomerPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Nuevo cliente");
  }, [setTitle]);

  return <CustomerForm />;
}
