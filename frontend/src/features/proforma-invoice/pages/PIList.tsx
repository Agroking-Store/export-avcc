import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  FilePenLine,
  Trash2,
  Search,
  ChevronsUpDown,
  BrushCleaning,
  MoveLeft,
  MoveRight,
  Plus,
  Inbox,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export interface ProformaInvoice {
  _id: string;
  piNumber: string;
  client_id?: { name: string; clientCode: string };
  totalAmount: number;
  status: string;
  validityDate?: string;
}

const PIList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Table Server-Side States
  const [pageCount, setPageCount] = useState(-1);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Debounce search input to avoid slamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter]);

  const handleClearFilters = () => {
    setSearchInput("");
    setGlobalFilter("");
    setStatusFilter("all");
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    toast.info("Filters cleared");
  };

  const fetchPIs = useCallback(async () => {
    try {
      setLoading(true);
      const sortParam = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

      const res = await axios.get(`${apiConfig.baseURL}/proforma-invoices`, {
        params: {
          search: globalFilter,
          page: pagination.pageIndex + 1, // API usually expects 1-indexed pages
          limit: pagination.pageSize,
          sortBy: sortParam,
          sortOrder: sortOrder,
          status: statusFilter,
        },
      });

      setData(res.data.data);
      setPageCount(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch Proforma Invoices");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    globalFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchPIs();
  }, [fetchPIs]);

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
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`${apiConfig.baseURL}/proforma-invoices/${id}`);
        toast.success("Proforma Invoice deleted successfully");
        fetchPIs();
      } catch {
        toast.error("Failed to delete Proforma Invoice");
      }
    },
    [fetchPIs]
  );

  const columns = useMemo<ColumnDef<ProformaInvoice>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "piNumber",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            PI No <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.piNumber}</span>
        ),
      },
      {
        accessorKey: "client_id.name",
        id: "client",
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
            <div className="font-medium">{row.original.client_id?.name}</div>
            <div className="text-xs text-gray-500">
              {row.original.client_id?.clientCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Amount <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center font-semibold text-slate-700">
            ${row.original.totalAmount}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Status <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                row.original.status
              )}`}
            >
              {row.original.status
                ?.split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "validityDate",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Date <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.validityDate
              ? new Date(row.original.validityDate).toLocaleDateString(
                  "en-GB",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )
              : "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-bold text-gray-700">Actions</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 cursor-pointer"
                    onClick={() =>
                      navigate(`/proforma-invoice/edit/${row.original._id}`)
                    }
                  >
                    <FilePenLine className="h-6 w-6 text-blue-600 cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Edit PI</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 cursor-pointer"
                    onClick={() => handleDelete(row.original._id)}
                  >
                    <Trash2 className="h-6 w-6 text-red-500 cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Delete PI</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
      },
    ],
    [navigate, handleDelete, pagination.pageIndex, pagination.pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-400 mx-auto space-y-4 md:space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Proforma Invoices
        </h1>
      </div>

      {/* UNIFIED CONTAINER FOR FILTERS AND TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* FILTERS SECTION */}
        <div className="p-4 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <div className="relative w-full lg:max-w-md shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search PI number or status..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 py-2 w-full rounded-md border border-gray-300 bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto items-center">
            <div className="w-full sm:w-48 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 px-3 py-2 w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all" className="text-base cursor-pointer">
                    All Statuses
                  </SelectItem>
                  <SelectItem
                    value="draft"
                    className="text-base cursor-pointer"
                  >
                    Draft
                  </SelectItem>
                  <SelectItem
                    value="pending_approval"
                    className="text-base cursor-pointer"
                  >
                    Pending Approval
                  </SelectItem>
                  <SelectItem
                    value="approved"
                    className="text-base cursor-pointer"
                  >
                    Approved
                  </SelectItem>
                  <SelectItem
                    value="sent_to_buyer"
                    className="text-base cursor-pointer"
                  >
                    Sent to Buyer
                  </SelectItem>
                  <SelectItem
                    value="lc_received"
                    className="text-base cursor-pointer"
                  >
                    LC Received
                  </SelectItem>
                  <SelectItem
                    value="expired"
                    className="text-base cursor-pointer"
                  >
                    Expired
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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

              <Button
                onClick={() => navigate("/proforma-invoice/add")}
                className="h-10 px-4 shrink-0 rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-1 sm:flex-none cursor-pointer"
              >
                <Plus className="h-4 w-4 sm:mr-2 cursor-pointer" />
                <span className="hidden sm:inline">Create PI</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT (Table) */}
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
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-40 text-center p-4"
                  >
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl min-h-40 bg-gray-50 text-center p-8">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium text-lg">
                        No Proforma Invoices found!
                      </p>
                      <p className="text-gray-400">
                        {searchInput || statusFilter !== "all"
                          ? "Adjust your filters or search term."
                          : "Create a new PI to get started."}
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
      </div>
    </div>
  );
};

export default PIList;
