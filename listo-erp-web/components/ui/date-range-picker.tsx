"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
}

function parseDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  placeholder,
  clearLabel,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const range: DateRange = {
    from: parseDate(dateFrom),
    to: parseDate(dateTo),
  };
  const label = range.from
    ? range.to
      ? `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`
      : format(range.from, "dd/MM/yyyy")
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal md:w-64", !range.from && "text-muted-foreground", className)}
        >
          <CalendarDays className="mr-2 size-4" />
          <span className="truncate">{label}</span>
          {range.from ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={clearLabel}
              className="ml-auto rounded-sm p-0.5 hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                onChange({ dateFrom: "", dateTo: "" });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange({ dateFrom: "", dateTo: "" });
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={range}
          onSelect={(nextRange) => {
            onChange({
              dateFrom: nextRange?.from ? format(nextRange.from, "yyyy-MM-dd") : "",
              dateTo: nextRange?.to ? format(nextRange.to, "yyyy-MM-dd") : "",
            });
            if (nextRange?.from && nextRange?.to) setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
