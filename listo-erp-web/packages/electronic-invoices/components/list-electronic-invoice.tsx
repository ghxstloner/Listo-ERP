"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import type { ElectronicInvoiceListItem } from "../types";
import { ElectronicInvoiceTable } from "./electronic-invoice-table";

interface ListElectronicInvoiceProps {
  invoices: ElectronicInvoiceListItem[];
  headerAction?: React.ReactNode;
}

export function ListElectronicInvoice({
  invoices,
  headerAction,
}: ListElectronicInvoiceProps) {
  const t = useTranslation();

  return (
    <Card className="w-full">
      <CardContent>
        <ElectronicInvoiceTable
          invoices={invoices ?? []}
          t={t}
        />
      </CardContent>
    </Card>
  );
}
