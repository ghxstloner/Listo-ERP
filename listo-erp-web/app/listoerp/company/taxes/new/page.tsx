"use client";

import { Button } from "@/components/ui/button";
import { CompanyTaxForm } from "@/packages/company/components/company-tax-form";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function NewCompanyTaxPage() {
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
        <CompanyTaxForm />
      </div>
    </div>
  );
}
