import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
  TableHeader,
} from "@/components/ui/table";
import { flexRender, Table as ReactTableType } from "@tanstack/react-table"; // Re-added flexRender
import { Inbox, MoveLeft, MoveRight } from "lucide-react"; // Keep these for the table body/pagination
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Keep these for pagination
import { Button } from "@/components/ui/button"; // Keep these for pagination
import React from "react";

export interface ProformaInvoice {
  _id: string;
  piNumber: string;
  client_id?: { name: string; clientCode: string };
  totalAmount: number;
  status: string;
  validityDate?: string;
}

export interface PIListTableProps {
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  table: ReactTableType<ProformaInvoice>;
  generatePagination: (
    currentPage: number,
    totalPages: number
  ) => (number | string)[];
}

const PIListTable: React.FC<PIListTableProps> = ({
  loading,
  navigate,
  table,
  generatePagination,
}) => {
  return (
    <>
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 text-gray-700 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-bold text-gray-700 whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          // flexRender is still needed here to render the header content
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({
                length: table.getState().pagination.pageSize,
              }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-gray-100">
                  <TableCell>
                    <div className="h-4 w-6 rounded bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 rounded bg-gray-200 animate-pulse mb-2" />
                    <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 rounded bg-gray-200 animate-pulse mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-24 rounded-full bg-gray-200 animate-pulse mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <div className="h-9 w-9 rounded bg-gray-200 animate-pulse" />
                      <div className="h-9 w-9 rounded bg-gray-200 animate-pulse" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowCount() === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-40 text-center p-4"
                >
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl min-h-40 bg-gray-50 text-center p-8">
                    <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium text-lg">
                      No Proforma Invoices found!
                    </p>
                    <p className="text-gray-400">
                      Adjust your filters or search term.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.closest(
                        "button, a, input, textarea, select, label"
                      )
                    )
                      return;
                    const selectedText = window
                      .getSelection?.()
                      ?.toString()
                      .trim();
                    if (selectedText) return;
                    navigate(`/proforma-invoice/${row.original._id}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {table.getPageCount() > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-t border-gray-200 bg-white gap-4">
          {/* Left: Items per row */}
          <div className="flex items-center gap-2 w-full lg:w-1/3 justify-center lg:justify-start">
            <span className="text-sm text-gray-500">Show</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-17.5 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className="min-w-17.5"
              >
                {[5, 10, 25, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={pageSize.toString()}
                    className="text-base cursor-pointer"
                  >
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
              className="text-xs border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <MoveLeft className="h-3 w-3 mr-1" /> Prev
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
              className="text-xs border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Next <MoveRight className="h-3 w-3 ml-1" />
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
    </>
  );
};

export default PIListTable;
