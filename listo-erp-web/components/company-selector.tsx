"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyCompanyTheme } from "@/lib/company-theme";
import { useGetMyCompanies } from "@/packages/company-user/api";
import { setApiCompanyId } from "@config";
import { Buildings, Spinner } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function CompanySelector() {
  const router = useRouter();
  const [companies, isLoading] = useGetMyCompanies();
  const currentCompanyId =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("selected-company="))
          ?.split("=")[1] ?? ""
      : "";

  if (isLoading) {
    return <Spinner size={20} className="animate-spin" />;
  }

  if (!companies || companies.length === 0) return null;

  if (companies.length === 1) {
    const company = companies[0].company;
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Buildings className="h-4 w-4" />
        <span>{company.name}</span>
      </div>
    );
  }

  return (
    <Select
      value={currentCompanyId}
      onValueChange={(newCompanyId) => {
        const companyUser = companies.find(
          (cu) => String(cu.company.id) === newCompanyId,
        );
        if (!companyUser) return;

        setApiCompanyId(String(companyUser.company.id));
        applyCompanyTheme({
          primaryColor: companyUser.company.primaryColor,
          secondaryColor: companyUser.company.secondaryColor,
        });
        window.location.reload();
      }}
    >
      <SelectTrigger className="h-8 w-auto min-w-[120px] max-w-[200px] border-none bg-transparent px-2 text-sm font-medium text-muted-foreground shadow-none hover:bg-accent/50">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Buildings className="h-4 w-4 shrink-0" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((cu) => (
          <SelectItem key={cu.company.id} value={String(cu.company.id)}>
            {cu.company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
