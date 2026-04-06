import React, { useCallback } from "react";
import { type NavigateFunction } from "react-router-dom";
import { flexRender, Table as ReactTableType } from "@tanstack/react-table";
import {
  Loader2,
  SlidersHorizontal, // Keep SlidersHorizontal for column visibility toggle
  BrushCleaning, // Changed Check to BrushCleaning icon
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
import { Input } from "@/components/ui/input"; // Added Input
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select components

interface CompanyTableProps {
  table: ReactTableType<Company>;
  loading: boolean;
  navigate: NavigateFunction;
  // companies: Company[]; // Removed as data is accessed via table instance
  pageCount: number; // Added pageCount
  searchInput: string; // Added searchInput
  setSearchInput: (value: string) => void; // Added setSearchInput
  setGlobalFilter: (value: string) => void; // Added setGlobalFilter
  setSorting: (updater: any) => void; // Added setSorting
  setPagination: (updater: any) => void; // Added setPagination
  setColumnVisibility: (
    updater: React.SetStateAction<Record<string, boolean>>
  ) => void; // Added setColumnVisibility
  generatePagination: (
    currentPage: number,
    totalPages: number
  ) => (number | string)[];
  statusFilter: "all" | "active" | "inactive"; // New prop for status filter
  setStatusFilter: (status: "all" | "active" | "inactive") => void; // New prop for setting status filter
}

const CompanyTable: React.FC<CompanyTableProps> = ({
  table,
  loading,
  navigate, // Add navigate to the destructuring of props
  searchInput,
  setSearchInput,
  setGlobalFilter,
  setSorting,
  setPagination,
  setColumnVisibility,
  generatePagination,
  statusFilter, // Destructure new prop
  setStatusFilter, // Destructure new prop
  // companies, // Removed from props
}) => {
  const MIN_COMPANY_COLUMNS = 4; // Minimum dynamic columns to be visible (companyId, name, isActive + 1 more)
  const MAX_COMPANY_COLUMNS = 6; // Maximum dynamic columns to be visible

  const handleCompanyColumnToggle = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;

    const isVisible = column.getIsVisible();
    const currentVisibleCount = table
      .getVisibleLeafColumns()
      .filter((c) => c.getCanHide()).length;

    if (isVisible && currentVisibleCount <= MIN_COMPANY_COLUMNS) {
      toast.warning(`At least ${MIN_COMPANY_COLUMNS} columns must be visible!`);
      return;
    }
    if (!isVisible && currentVisibleCount >= MAX_COMPANY_COLUMNS) {
      toast.warning(`Maximum ${MAX_COMPANY_COLUMNS} columns can be visible!`);
      return;
    }
    column.toggleVisibility(!isVisible);
  };

  const resetCompanyToDefaultColumns = () => {
    setColumnVisibility({
      // Use setColumnVisibility from props
      serialNumber: true,
      companyId: true, // Default visible
      name: true, // Default visible
      email: false, // Default hidden
      actions: true,
      phone: false, // Assuming these are default hidden
      "address.country": false, // Assuming these are default hidden
      isActive: true, // Default visible
      "bankDetails.bankName": false, // Default hidden
    });
    toast.success("Columns reset to default.");
  };

  const getColumnLabel = (columnId: string): string => {
    switch (columnId) {
      case "serialNumber":
        return "S.No";
      case "companyId":
        return "Company ID";
      case "name":
        return "Name";
      case "email":
        return "Email";
      case "phone":
        return "Phone";
      case "address.country":
      case "address_country":
        return "Country";
      case "isActive":
      case "is Active":
        return "Status";
      case "bankDetails.bankName":
        return "Status";
      case "actions":
        return "Actions";
      default:
        // Fallback for any other columns, though we expect all to be covered
        return columnId.replace(/([A-Z])/g, " $1").trim();
    }
  };

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setGlobalFilter("");
    setSorting([]);
    setPagination({
      // Reset pagination
      pageIndex: 0,
      pageSize: table.getState().pagination.pageSize,
    }); // Reset pageIndex
    resetCompanyToDefaultColumns();
    toast.info("Filters cleared");
  }, [
    setSearchInput,
    setGlobalFilter, // setGlobalFilter is used to clear the global filter
    setSorting, // setSorting is used to clear sorting
    setPagination, // setPagination is used to reset pageIndex
    setStatusFilter, // Reset status filter
    resetCompanyToDefaultColumns, // resetCompanyToDefaultColumns is called
  ]);

  return (
    // Main container for the table and controls
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-auto grow">
          <Input
            placeholder="Search companies..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              table.setGlobalFilter(event.target.value);
            }}
            className="max-w-sm"
          />
        </div>

        {/* Status Filter Chooser */}
        <div className="w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="h-10 px-4 w-full sm:w-37.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              position="popper"
              className="z-50"
            >
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {/* Clear Filters Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-10 w-10 p-0 shrink-0 rounded-md shadow-sm border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <BrushCleaning className="h-4 w-4 text-gray-500 cursor-pointer" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                Clear Filters
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Column Visibility for Company Table */}{" "}
          {/* This was already wrapped correctly */}
          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-10 p-0 shrink-0 rounded-md shadow-sm border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-gray-500 cursor-pointer" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  Toggle Columns
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={4}
              className="w-60 bg-white shadow-xl border rounded-xl z-60 flex flex-col" // Increased z-index
            >
              <div className="text-xs font-semibold border-b px-3 py-2 text-gray-500">
                Visible Columns (
                {
                  table.getVisibleLeafColumns().filter((c) => c.getCanHide())
                    .length
                }
                /{MAX_COMPANY_COLUMNS})
              </div>
              <div className="max-h-65 overflow-y-auto px-1">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <div
                      key={column.id}
                      onClick={() => handleCompanyColumnToggle(column.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer hover:bg-gray-100 text-sm ${
                        column.getIsVisible()
                          ? "text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">
                        {getColumnLabel(column.id)}
                      </span>
                      {column.getIsVisible() && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
              </div>
              <div className="border-t p-2">
                <PopoverClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={resetCompanyToDefaultColumns}
                  >
                    Reset to Default
                  </Button>
                </PopoverClose>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="relative overflow-x-auto border-t border-gray-200">
        {" "}
        {/* Added border-t */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-gray-500">
            <thead className="text-sm text-gray-700 uppercase bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col" className="px-6 py-3">
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
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-3" />
                      Loading companies...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="text-center py-8"
                  >
                    No companies found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/companies/${row.original._id}`)} // Make the entire row clickable
                    className="bg-white border-b hover:bg-gray-50 cursor-pointer" // Add cursor-pointer for UX
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-2 text-base font-bold"
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
      </div>

      {/* PAGINATION */}
      {table.getPageCount() > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-t border-gray-200 bg-white gap-4">
          {/* Left: Items per row */}
          <div className="flex items-center gap-2 w-full lg:w-1/3 justify-center lg:justify-start">
            <span className="text-sm text-gray-500">Show</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-17.5 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Center: Pagination Buttons */}
          <div className="flex items-center justify-center space-x-1 w-full lg:w-1/3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-sm border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Prev
            </Button>

            <div className="items-center space-x-1 flex sm:flex">
              {generatePagination(
                table.getState().pagination.pageIndex + 1,
                table.getPageCount()
              ).map((item, idx) =>
                item === "..." ? (
                  <span key={idx} className="px-2 text-gray-500 text-xs">
                    ...
                  </span>
                ) : (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex((item as number) - 1)}
                    className={`text-xs h-8 w-8 p-0 transition-colors cursor-pointer ${
                      table.getState().pagination.pageIndex + 1 === item
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                        : "border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {item}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-sm border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Next
            </Button>
          </div>

          {/* Right: Page indicator */}
          <div className="flex justify-center lg:justify-end w-full lg:w-1/3">
            <span className="text-sm text-gray-500">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTable;
