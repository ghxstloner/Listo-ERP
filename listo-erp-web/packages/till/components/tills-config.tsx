"use client";

import { PageLoading } from "@/components/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useGetBranchesByCompany } from "@/packages/branch/api";
import { useGetTills } from "@/packages/till/api";
import { MagnifyingGlass, Spinner } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { CreateTill } from "./modals/create-till";
import { TillCard } from "./till-card";

interface TillsConfigProps {
  companyId: number;
}

export function TillsConfig({ companyId }: TillsConfigProps) {
  const t = useTranslation();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [tills, isLoadingTills, tillError] = useGetTills();
  const [branches] = useGetBranchesByCompany(companyId);

  const companyBranches = useMemo(
    () => branches?.filter((b) => b.companyId === companyId) ?? branches ?? [],
    [branches, companyId],
  );

  const filteredTills = useMemo(() => {
    if (!tills) return [];
    let list = [...tills];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (till) =>
          till.tillName?.toLowerCase().includes(q) ||
          till.tillCode?.toLowerCase().includes(q) ||
          till.branch?.name?.toLowerCase().includes(q) ||
          till.branch?.branchCode?.toLowerCase().includes(q),
      );
    }
    if (branchFilter !== "all") {
      const bid = Number(branchFilter);
      if (!Number.isNaN(bid))
        list = list.filter((till) => till.branchId === bid);
    }
    if (statusFilter === "ACTIVE") list = list.filter((till) => till.isActive);
    if (statusFilter === "INACTIVE")
      list = list.filter((till) => !till.isActive);
    return list;
  }, [tills, search, branchFilter, statusFilter]);

  if (isLoadingTills) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (tillError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(tillError as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <MagnifyingGlass
              className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              weight="bold"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("company.tills.searchTills")}
              className="pl-9"
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder={t("company.tills.filterByBranch")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("company.tills.allBranches")}
              </SelectItem>
              {companyBranches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder={t("company.tills.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("company.tills.allStatuses")}
              </SelectItem>
              <SelectItem value="ACTIVE">
                {t("company.tills.active")}
              </SelectItem>
              <SelectItem value="INACTIVE">
                {t("company.tills.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0">
          <CreateTill companyId={companyId} />
        </div>
      </div>

      {filteredTills.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center py-10">
            <p className="text-muted-foreground">
              {t("company.tills.noTills")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTills.map((till) => (
            <TillCard key={till.id} till={till} />
          ))}
        </div>
      )}
    </div>
  );
}
