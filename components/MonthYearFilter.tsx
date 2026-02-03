import React from "react";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MonthYearSelection {
  month: number | null; // 0-11, null means all months
  year: number;
}

interface MonthYearFilterProps {
  value: MonthYearSelection;
  onChange: (value: MonthYearSelection) => void;
  showAllMonthsOption?: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
};

export const MonthYearFilter: React.FC<MonthYearFilterProps> = ({
  value,
  onChange,
  showAllMonthsOption = true,
}) => {
  const years = getYearOptions();

  const handleMonthChange = (monthValue: string) => {
    onChange({
      ...value,
      month: monthValue === "all" ? null : parseInt(monthValue, 10),
    });
  };

  const handleYearChange = (yearValue: string) => {
    onChange({
      ...value,
      year: parseInt(yearValue, 10),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
      <Select
        value={value.month === null ? "all" : value.month.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {showAllMonthsOption && (
            <SelectItem value="all">All Months</SelectItem>
          )}
          {MONTHS.map((month, index) => (
            <SelectItem key={month} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.year.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Helper function to check if a date matches the filter
export const matchesMonthYearFilter = (
  date: Date,
  filter: MonthYearSelection,
): boolean => {
  const d = new Date(date);
  const matchesYear = d.getFullYear() === filter.year;
  const matchesMonth = filter.month === null || d.getMonth() === filter.month;
  return matchesYear && matchesMonth;
};
