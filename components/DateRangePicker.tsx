"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns"; 
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ date, setDate }: DateRangePickerProps) {
  const formatDateRange = () => {
    if (!date?.from) return "Pick a date range";
    
    if (date.to) {
      // Format for short display
      return (
        <>
          <span className="hidden lg:inline">
            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
          </span>
          <span className="lg:hidden">
            {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, yyyy")}
          </span>
        </>
      );
    }
    
    return format(date.from, "LLL dd, y");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex w-full justify-start items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-left text-sm font-normal text-white hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
            !date && "text-gray-400"
          )}
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{formatDateRange()}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
        align="start"
      >
        <div className="p-3">
          <CalendarComponent
            mode="range"
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-gray-200",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-300 hover:bg-gray-700 rounded-md transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-700/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-200 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-700 text-white font-semibold",
              day_outside: "text-gray-500 opacity-50",
              day_disabled: "text-gray-500 opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-blue-600/30 aria-selected:text-white rounded-none",
              day_range_start: "rounded-l-md rounded-r-none",
              day_range_end: "rounded-r-md rounded-l-none",
              day_hidden: "invisible",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}