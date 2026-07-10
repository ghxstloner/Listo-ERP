"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DotsThreeVertical, Pencil, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { Seller } from "../types";

type TFunction = (key: string) => string;

interface SellerTableProps {
  sellers: Seller[];
  onEdit: (seller: Seller) => void;
  onDelete: (seller: Seller) => void;
  isDeleting: boolean;
  deletingSellerId: number | null;
  t: TFunction;
  action?: React.ReactNode;
}

function StatusPill({ isActive, t }: { isActive: boolean; t: TFunction }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? t("sales.sellers.active") : t("sales.sellers.inactive")}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export function SellerTable({
  sellers,
  onEdit,
  onDelete,
  isDeleting,
  deletingSellerId,
  t,
  action,
}: SellerTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers.filter((seller) => {
      if (status === "ACTIVE" && !seller.isActive) return false;
      if (status === "INACTIVE" && seller.isActive) return false;
      if (!q) return true;
      return [
        seller.code,
        seller.name,
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [sellers, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("sales.sellers.searchSellers")}
            className="sm:max-w-sm"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="default" className="min-w-40">
              <SelectValue placeholder={t("sales.sellers.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("sales.sellers.allStatuses")}
              </SelectItem>
              <SelectItem value="ACTIVE">
                {t("sales.sellers.active")}
              </SelectItem>
              <SelectItem value="INACTIVE">
                {t("sales.sellers.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {action}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>{t("sales.sellers.code")}</TableHead>
              <TableHead>{t("sales.sellers.name")}</TableHead>
              <TableHead>{t("sales.sellers.status")}</TableHead>
              <TableHead>{t("sales.sellers.createdAt")}</TableHead>
              <TableHead className="text-right">
                {t("sales.sellers.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSellers.length ? (
              filteredSellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.code}</TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{seller.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill isActive={seller.isActive} t={t} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(seller.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">
                              {t("sales.sellers.actions")}
                            </span>
                            <DotsThreeVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(seller)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(seller)}
                            className="text-destructive focus:text-destructive"
                            disabled={
                              isDeleting && deletingSellerId === seller.id
                            }
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("sales.sellers.noSellers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
