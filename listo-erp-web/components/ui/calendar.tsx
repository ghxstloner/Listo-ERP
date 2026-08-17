"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: "absolute left-1 size-7 rounded-md border bg-transparent p-0 opacity-70 hover:opacity-100",
        button_next: "absolute right-1 size-7 rounded-md border bg-transparent p-0 opacity-70 hover:opacity-100",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 rounded-md text-[0.8rem] font-normal",
        week: "mt-2 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_middle: "rounded-none bg-primary/15 text-foreground",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        selected: "bg-primary text-primary-foreground",
        hidden: "invisible",
        day_button: "size-9 rounded-md p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
        ...classNames,
      }}
      {...props}
    />
  );
}
