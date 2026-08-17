"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface ProductHistoryFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  dateFrom: string;
  dateTo: string;
  onDateChange: (range: { dateFrom: string; dateTo: string }) => void;
  datePlaceholder: string;
  clearLabel: string;
  onClear: () => void;
  children?: React.ReactNode;
}

export function ProductHistoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  dateFrom,
  dateTo,
  onDateChange,
  datePlaceholder,
  clearLabel,
  onClear,
  children,
}: ProductHistoryFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1 xl:max-w-sm">
        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      {children}
      <DateRangePicker
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={onDateChange}
        placeholder={datePlaceholder}
        clearLabel={clearLabel}
      />
      <Button type="button" variant="outline" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  );
}
