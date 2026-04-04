import React from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
  TableHeader,
} from "@/components/ui/table"; // This is the UI component <Table>
import {
  flexRender,
  Table as TanstackTableType, // Alias the type from @tanstack/react-table to avoid conflict with UI <Table> component
  HeaderGroup, // Import for typing headerGroup
  Header, // Import for typing header
} from "@tanstack/react-table"; // This is the @tanstack/react-table library
import { Inbox, MoveLeft, MoveRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // Keep these for pagination
// Removed ProgressBar component from here as it's moved to PIList.tsx
import { useNavigate } from "react-router-dom";

export interface OrderWithPIStatus {
  _id: string;
  orderId: string;
  voucherNo: string;
  date: string; // Assuming date comes as a string from the backend
  client: { name: string; companyName?: string; clientCode?: string };
  dealer: { name: string };
  totalVehiclesInOrder: number;
  totalVehiclesPIed: number;
  pendingVehicles: number;
  overallPIStatus: string;
  createdAt: string; // Added for 'Created' column
  updatedAt: string; // Added for 'Last Updated' column
}

// Define OrderListTableProps interface here
export interface OrderListTableProps {
  loading: boolean;
  table: TanstackTableType<OrderWithPIStatus>; // Use the aliased type for the table instance
  generatePagination: (
    // Added navigate prop
    currentPage: number,
    totalPages: number
  ) => (number | string)[];
}

const OrderListTable: React.FC<OrderListTableProps> = ({
  loading,
  table,
  generatePagination,
}) => {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <>
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 text-gray-700 border-b border-gray-200">
            {table.getHeaderGroups().map(
              (
                headerGroup: HeaderGroup<OrderWithPIStatus> // Explicitly type headerGroup
              ) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(
                    (
                      header: Header<OrderWithPIStatus, unknown> // Explicitly type header
                    ) => (
                      <TableHead // Default to text-left, can be overridden by column definitions
                        key={header.id}
                        className="font-bold text-gray-700 whitespace-nowrap text-left"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              // flexRender is correctly used here
                              header.column.columnDef.header, // Accessing header definition
                              header.getContext() // Providing context
                            )}{" "}
                      </TableHead>
                    )
                  )}
                </TableRow>
              )
            )}
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
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse mx-auto" />
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
                      No Orders found!
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
                  onClick={() =>
                    navigate(`/proforma-invoice/orders/${row.original._id}`)
                  }
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

export default OrderListTable;
