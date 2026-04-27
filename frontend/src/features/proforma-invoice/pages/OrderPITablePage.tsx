import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Search,
  BrushCleaning,
  ChevronsUpDown,
  SlidersHorizontal,
  Check,
  Inbox,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import {
  getCoreRowModel,
  useReactTable,
  PaginationState,
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { OrderWithPIStatus } from "../components/pi.types"; // Import from shared types
import ProgressBar from "../../../components/common/ProgressBar";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const getAuthToken = () => {
  let token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  if (!token && localStorage.getItem("user")) {
    try {
      const userObj = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
      token = userObj.token || userObj.accessToken;
    } catch {}
  }

  if (token?.startsWith('"') && token?.endsWith('"')) {
    token = token.slice(1, -1);
  }

  return token;
};

interface OrderPITablePageProps {
  generatePagination: (
    currentPage: number,
    totalPages: number
  ) => (number | string)[];
}

const OrderPITablePage: React.FC<OrderPITablePageProps> = ({
  generatePagination,
}) => {
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<OrderWithPIStatus[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderPageCount, setOrderPageCount] = useState(-1);
  const [searchInput, setSearchInput] = useState("");
  const [orderGlobalFilter, setOrderGlobalFilter] = useState(""); // Separate filter for orders
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]); // Default sort by createdAt descending
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [orderColumnVisibility, setOrderColumnVisibility] =
    useState<VisibilityState>(() => {
      const saved = localStorage.getItem("order-list-columns");
      return saved
        ? JSON.parse(saved)
        : {
            serialNumber: true,
            orderId: true,
            voucherNo: true,
            clientName: true,
            piProgress: true,
            overallPIStatus: false,
            createdAt: false,
            updatedAt: false,
          };
    });

  // Debounce search input to avoid slamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderGlobalFilter(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset page
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Effect to save column visibility to local storage
  useEffect(() => {
    localStorage.setItem(
      "order-list-columns",
      JSON.stringify(orderColumnVisibility)
    );
  }, [orderColumnVisibility]);

  const fetchOrdersWithPIStatus = useCallback(async () => {
    try {
      setOrderLoading(true);
      const sortParam = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/orders-with-pi-status`,
        {
  params: {
    search: orderGlobalFilter,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sortParam,
    sortOrder: sortOrder,
  },
  headers: getAuthToken()
    ? { Authorization: `Bearer ${getAuthToken()}` }
    : {},
}
      );
      setOrderData(res.data.data);
      setOrderPageCount(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch Orders with PI status");
    } finally {
      setOrderLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, sorting, orderGlobalFilter]);

  useEffect(() => {
    fetchOrdersWithPIStatus();
  }, [fetchOrdersWithPIStatus]);

  const getPIProgressBarColor = (status: string) => {
    switch (status) {
      case "Fully PI'd":
        return "bg-green-600";
      case "Partially PI'd":
        return "bg-green-500";
      case "Not Started":
        return "bg-slate-200";
      default:
        return "bg-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "pending_approval":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "sent_to_buyer":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "lc_received":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "Fully PI'd":
        return "bg-green-100 text-green-700 border-green-200";
      case "Partially PI'd":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Not Started":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const orderColumns = useMemo<ColumnDef<OrderWithPIStatus>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {orderTable.getState().pagination.pageIndex *
              orderTable.getState().pagination.pageSize +
              row.index +
              1}
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
        size: 60,
      },
      {
        accessorKey: "orderId",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Order ID <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        id: "orderId",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.orderId || row.original.orderNumber || "-"}</span>
        ),
      },
      {
        accessorKey: "voucherNo",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Voucher No <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        id: "voucherNo",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.voucherNo || row.original.voucherNumber || "-"}</span>
        ),
      },
      {
        accessorKey: "client.name",
        id: "clientName",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Client <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.client?.name || row.original.clientName || "N/A"}</div>
            <div className="text-xs text-gray-500">
              {row.original.client?.clientCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "dealer.name",
        id: "dealerName",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Dealer <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.original.dealer?.name || row.original.dealerName || "-"}
          </div>
        ),
      },
      {
        id: "piProgress",
        header: () => (
          <div className="text-center font-bold text-gray-700">PI Progress</div>
        ),
        cell: ({ row }) => {
          const total = row.original.totalVehiclesInOrder;
          const pied = row.original.totalVehiclesPIed;
          const percentage = total > 0 ? (pied / total) * 100 : 0;
          const status = row.original.overallPIStatus;
          const colorClass = getPIProgressBarColor(status);

          return (
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700">
                {pied}/{total} Vehicles
              </div>
              <div className="w-full max-w-37.5 mt-1">
                <ProgressBar
                  value={percentage}
                  statusText=""
                  colorClass={colorClass}
                />
              </div>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Created <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        id: "updatedAt",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Last Updated <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {new Date(row.original.updatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        id: "overallPIStatus",
        header: () => (
          <div className="text-center font-bold text-gray-700">PI Status</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                row.original.overallPIStatus
              )}`}
            >
              {row.original.overallPIStatus}
            </span>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [getStatusColor, getPIProgressBarColor, pagination]
  );

  const orderTable = useReactTable<OrderWithPIStatus>({
    data: orderData,
    columns: orderColumns,
    pageCount: orderPageCount,
    state: {
      pagination,
      sorting,
      columnVisibility: orderColumnVisibility,
    },
    onColumnVisibilityChange: setOrderColumnVisibility,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const MIN_ORDER_COLUMNS = 4;
  const MAX_ORDER_COLUMNS = 6;

  const handleOrderColumnToggle = (columnId: string) => {
    const column = orderTable.getColumn(columnId);
    if (!column) return;

    const isVisible = column.getIsVisible();
    const currentVisibleCount = orderTable
      .getVisibleLeafColumns()
      .filter((c) => c.getCanHide()).length;

    if (isVisible && currentVisibleCount <= MIN_ORDER_COLUMNS) {
      toast.warning(`At least ${MIN_ORDER_COLUMNS} columns must be visible!`);
      return;
    }
    if (!isVisible && currentVisibleCount >= MAX_ORDER_COLUMNS) {
      toast.warning(`Maximum ${MAX_ORDER_COLUMNS} columns can be visible!`);
      return;
    }
    column.toggleVisibility(!isVisible);
  };

  const resetOrderToDefaultColumns = () => {
    setOrderColumnVisibility({
      serialNumber: true,
      orderId: true,
      voucherNo: true,
      clientName: true,
      piProgress: true,
      overallPIStatus: false,
      dealerName: false,
      createdAt: false,
      updatedAt: false,
    });
    toast.success("Columns reset to default.");
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setOrderGlobalFilter("");
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    resetOrderToDefaultColumns();
    toast.info("Filters cleared");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* FILTERS SECTION for Order Perspective */}
      <div className="p-4 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:max-w-md shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search Order ID, Client, Dealer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 py-2 w-full rounded-md border border-gray-300 bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors text-sm"
          />
        </div>
        {/* Actions */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <TooltipProvider delayDuration={300}>
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

            {/* Column Visibility for Order Table */}
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
                className="w-60 bg-white shadow-xl border rounded-xl z-50 flex flex-col"
              >
                <div className="text-xs font-semibold border-b px-3 py-2 text-gray-500">
                  Visible Columns (
                  {
                    orderTable
                      .getVisibleLeafColumns()
                      .filter((c) => c.getCanHide()).length
                  }
                  /{MAX_ORDER_COLUMNS})
                </div>
                <div className="max-h-65 overflow-y-auto px-1">
                  {orderTable
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <div
                        key={column.id}
                        onClick={() => handleOrderColumnToggle(column.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer hover:bg-gray-100 text-sm capitalize ${
                          column.getIsVisible()
                            ? "text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-sm capitalize">
                          {column.id.replace(/([A-Z])/g, " $1").trim()}
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
                      onClick={resetOrderToDefaultColumns}
                    >
                      Reset to Default
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 text-gray-700 border-b border-gray-200">
            {orderTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-bold text-gray-700 whitespace-nowrap text-left"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {orderLoading ? (
              Array.from({
                length: orderTable.getState().pagination.pageSize,
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
            ) : orderTable.getRowCount() === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={orderTable.getAllColumns().length}
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
              orderTable.getRowModel().rows.map((row) => (
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
      {orderTable.getPageCount() > 0 && (
        <div className="flex flex-col lg:flex-row justify-between items-center p-4 border-t border-gray-200 bg-white gap-4">
          {/* Left: Items per row */}
          <div className="flex items-center gap-2 w-full lg:w-1/3 justify-center lg:justify-start">
            <span className="text-sm text-gray-500">Show</span>
            <Select
              value={orderTable.getState().pagination.pageSize.toString()}
              onValueChange={(value) => orderTable.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-10 w-24 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
                <SelectValue
                  placeholder={orderTable.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
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
              onClick={() => orderTable.previousPage()}
              disabled={!orderTable.getCanPreviousPage()}
              className="text-xs border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <MoveLeft className="h-3 w-3 mr-1" /> Prev
            </Button>

            <div className="items-center space-x-1 flex sm:flex">
              {generatePagination(
                orderTable.getState().pagination.pageIndex + 1,
                orderTable.getPageCount()
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
                    onClick={() =>
                      orderTable.setPageIndex((item as number) - 1)
                    }
                    className={`text-xs h-8 w-8 p-0 transition-colors cursor-pointer ${
                      orderTable.getState().pagination.pageIndex + 1 === item
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
              onClick={() => orderTable.nextPage()}
              disabled={!orderTable.getCanNextPage()}
              className="text-xs border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              Next <MoveRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Right: Page indicator */}
          <div className="flex justify-center lg:justify-end w-full lg:w-1/3">
            <span className="text-sm text-gray-500">
              Page {orderTable.getState().pagination.pageIndex + 1} of{" "}
              {orderTable.getPageCount()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPITablePage;
