"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { useGetTax } from "@/packages/company/api";
import { CompanyTaxForm } from "@/packages/company/components/company-tax-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CompanyTaxDetailPage() {
  const params = useParams();
  const taxId = Number(params.id);
  const [tax, loadingTax, taxError] = useGetTax(taxId);

  if (loadingTax) {
    return (
      <PageLoading
        text="Cargando impuesto..."
        icon={<Spinner size={32} />}
        spin
      />
    );
  }

  if (taxError || !tax) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">No se pudo cargar el impuesto.</p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company?tab=taxes">Volver a impuestos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <Button size="sm" variant="ghost" asChild>
        <Link
          href="/listoerp/company?tab=taxes"
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 size-4" />
          Impuestos
        </Link>
      </Button>
      <div className="mt-2">
        <CompanyTaxForm tax={tax} />
      </div>
    </div>
  );
}
