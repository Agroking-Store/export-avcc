import React, { useCallback } from "react";
import { type NavigateFunction } from "react-router-dom";
import { flexRender, Table as ReactTableType } from "@tanstack/react-table";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BrushCleaning,
  Inbox,
  Check,
} from "lucide-react";

import { Company } from "./company.types";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Popover,
  PopoverContent,
  PopoverClose,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyTableProps {
  table: ReactTableType<Company>;
  piLoading: boolean;
  navigate: NavigateFunction;
  pageCount: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
  setGlobalFilter: (value: string) => void;
  setSorting: (updater: any) => void;
  setPagination: (updater: any) => void;
  setColumnVisibility: (
    updater: React.SetStateAction<Record<string, boolean>>
  ) => void;
  generatePagination: (
    currentPage: number,
    totalPages: number
  ) => (number | string)[];
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (status: "all" | "active" | "inactive") => void;
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  table,
  navigate,
  searchInput,
  setSearchInput,
  setGlobalFilter,
  setSorting,
  setPagination,
  setColumnVisibility,
  generatePagination,
  statusFilter,
  setStatusFilter,
  piLoading,
}) => {
  const MIN_COLUMNS = 4;
  const MAX_COLUMNS = 6;

  const handleColumnToggle = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;

    const visibleCount = table
      .getVisibleLeafColumns()
      .filter((c) => c.getCanHide()).length;

    if (column.getIsVisible() && visibleCount <= MIN_COLUMNS) {
      toast.warning(`At least ${MIN_COLUMNS} columns must be visible`);
      return;
    }

    if (!column.getIsVisible() && visibleCount >= MAX_COLUMNS) {
      toast.warning(`Maximum ${MAX_COLUMNS} columns allowed`);
      return;
    }

    column.toggleVisibility(!column.getIsVisible());
  };

  const resetColumns = () => {
    setColumnVisibility({
      companyId: true,
      name: true,
      email: false,
      phone: false,
      isActive: true,
      actions: true,
      "address.country": false,
      "bankDetails.bankName": false,
    });

    toast.success("Columns reset");
  };

  const getColumnLabel = (columnId: string) => {
    switch (columnId) {
      case "companyId":
        return "Company ID";
      case "name":
        return "Name";
      case "email":
        return "Email";
      case "phone":
        return "Phone";
      case "address.country":
        return "Country";
      case "isActive":
        return "Status";
      case "actions":
        return "Actions";
      default:
        return columnId;
    }
  };

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setGlobalFilter("");
    setSorting([]);
    setStatusFilter("all");

    setPagination({
      pageIndex: 0,
      pageSize: table.getState().pagination.pageSize,
    });

    resetColumns();

    toast.info("Filters Cleared");
  }, [
    setSearchInput,
    setGlobalFilter,
    setSorting,
    setStatusFilter,
    setPagination,
    table,
  ]);

  return (
      <div className="overflow-hidden">
        {/* TOOLBAR */}
        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-4 flex-wrap">

    {/* FILTER */}
    <Select
      value={statusFilter}
      onValueChange={(value: any) => setStatusFilter(value)}
    >
      <SelectTrigger className="h-[44px] px-4 min-w-[210px] rounded-xl border border-blue-200 bg-blue-50/50 text-blue-600 text-sm font-medium shadow-none">
        <Filter size={16} className="mr-2 text-blue-500" />
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">Filter: All Companies</SelectItem>
        <SelectItem value="active">Filter: Active</SelectItem>
        <SelectItem value="inactive">Filter: Inactive</SelectItem>
      </SelectContent>
    </Select>

    {/* CLEAR */}
    <button
      onClick={clearFilters}
      className="h-[44px] w-[44px] rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
    >
      <BrushCleaning size={17} className="mx-auto" />
    </button>

    {/* COLUMNS */}
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-[44px] w-[44px] rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
          <SlidersHorizontal size={17} className="mx-auto" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-60 rounded-xl border bg-white shadow-xl p-0"
      >
        <div className="text-xs font-semibold text-slate-500 border-b px-3 py-2">
          Visible Columns
        </div>
      
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {table
            .getAllLeafColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <div
                key={column.id}
                onClick={() => handleColumnToggle(column.id)}
                className="flex justify-between items-center px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm"
              >
                <span>{getColumnLabel(column.id)}</span>
      
                {column.getIsVisible() && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </div>
            ))}
        </div>
      
        <div className="border-t p-2">
          <PopoverClose asChild>
            <Button
              onClick={resetColumns}
              variant="outline"
              className="w-full rounded-lg"
            >
              Reset
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
          </Popover>
        </div>

      {/* SEARCH */}
      <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
      
          <Input
            placeholder="Search company..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              table.setGlobalFilter(e.target.value);
            }}
            className="h-[44px] pl-10 pr-4 w-80 text-sm bg-slate-50/30 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      
      </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-center">
            <thead className="bg-slate-50 border-y border-slate-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {piLoading ? (
                Array.from({
                  length: table.getState().pagination.pageSize,
                }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="py-6">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-20">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Inbox size={42} />
                      <p>No Companies Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group transition-colors duration-200 hover:bg-blue-50/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-8 py-5 text-sm font-medium text-slate-700"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {table.getPageCount() > 0 && (
          <div className="px-8 py-5 flex justify-between items-center bg-white">
            <span className="text-sm text-slate-500 font-medium">
              Page{" "}
              <span className="text-[#0f172a] font-bold">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of {table.getPageCount()}
            </span>

            <div className="flex gap-6 items-center">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="cursor-pointer flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 hover:-translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
                Prev
              </button>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="cursor-pointer flex items-center gap-1 text-sm font-bold text-[#0f172a] hover:text-blue-600 hover:translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
  );
};

export default CompanyTable;