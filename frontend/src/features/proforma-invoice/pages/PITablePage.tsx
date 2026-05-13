import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Search,
  BrushCleaning,
  ChevronsUpDown,
  FilePenLine,
  Eye,
  Download,
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
import {
  Popover,
  PopoverContent,
  PopoverClose,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { ProformaInvoiceAPI } from "../components/pi.types";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Table,
  TableHeader,
} from "@/components/ui/table";
import { piApi } from "../components/piApi";

interface PITablePageProps {
  generatePagination: (
    currentPage: number,
    totalPages: number,
  ) => (number | string)[];
}

const PITablePage: React.FC<PITablePageProps> = ({ generatePagination }) => {
  const navigate = useNavigate();

  const [piData, setPiData] = useState<ProformaInvoiceAPI[]>([]);
  const [piLoading, setPiLoading] = useState(false);
  const [piPdfLoading, setPiPdfLoading] = useState<string | null>(null);
  const [piPageCount, setPiPageCount] = useState(-1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]); // Default sort by createdAt descending
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [piColumnVisibility, setPiColumnVisibility] = useState<VisibilityState>(
    () => {
      const saved = localStorage.getItem("pi-list-columns");
      return saved
        ? JSON.parse(saved)
        : {
            serialNumber: true,
            piNumber: true,
            client: true, // Corresponds to client_id.name
            totalAmount: true,
            status: true,
            actions: true,
            companyName: false, // Explicitly hidden by default
            validityDate: false, // Explicitly hidden by default
            createdAt: false, // Explicitly hidden by default
          };
    },
  );

  // Debounce search input to avoid slamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset page
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter]);

  // Effect to save column visibility to local storage
  useEffect(() => {
    localStorage.setItem("pi-list-columns", JSON.stringify(piColumnVisibility));
  }, [piColumnVisibility]);

  const fetchPIs = useCallback(async () => {
    try {
      setPiLoading(true);
      const sortParam = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

      let token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token && localStorage.getItem("user")) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "{}");
          token = userObj.token || userObj.accessToken;
        } catch (e) {}
      }

      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      const res = await axios.get(`${apiConfig.baseURL}/proforma-invoices`, {
        params: {
          search: globalFilter,
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          sortBy: sortParam,
          sortOrder: sortOrder,
          status: statusFilter,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPiData(res.data.data);
      setPiPageCount(res.data.totalPages || 1);
    } catch (error) {
      toast.error("Failed to fetch Proforma Invoices");
    } finally {
      setPiLoading(false);
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
  // const handlePiPdfAction = (
  //   id: string,
  //   _piNumber: string,
  //   action: "view" | "download",
  // ) => {
  //   const url = piApi.getPIViewUrl(id, action === "download");

  //   if (action === "view") {
  //     window.open(url, "_blank");
  //   } else {
  //     window.location.href = url;
  //   }
  // };

  const handlePiPdfAction = async (
    id: string,
    piNumber: string,
    action: "view" | "download",
  ) => {
    try {
      setPiPdfLoading(id);

      const response = await piApi.previewPDF(id);

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (action === "view") {
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const link = document.createElement("a");
        link.href = url;

        const fileName = `${piNumber.replace(/\//g, "-")}.pdf`;
        link.setAttribute("download", fileName);

        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Download started...");
      }
    } catch (error) {
      console.error("PDF Action Error", error);
      toast.error("Failed to process PDF download");
    } finally {
      setPiPdfLoading(null);
    }
  };

  const columns = useMemo<ColumnDef<ProformaInvoiceAPI>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "piNumber",
        id: "piNumber",
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
            <div className="font-medium">
              {(row.original.client_id as { name?: string })?.name || "N/A"}
            </div>
            <div className="text-xs text-gray-500">
              {(row.original.client_id as { clientCode?: string })
                ?.clientCode || "N/A"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "company_id.name",
        id: "companyName",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Company Name <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {(row.original.company_id as { name?: string })?.name || "N/A"}
            </div>
            <div className="text-xs text-gray-500">
              {(row.original.company_id as { name?: string })?.name
                ? "Exporter"
                : ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        id: "totalAmount",
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
            $
            {row.original.totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ),
        // Explicitly set ID for column visibility
      },
      {
        accessorKey: "validityDate",
        id: "validityDate",
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
                  },
                )
              : "-"}
          </div>
        ),
        // Explicitly set ID for column visibility
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Issue Date <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
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
                row.original.status,
              )}`}
            >
              {row.original.status
                ?.split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </span>
          </div>
        ),
        // Explicitly set ID for column visibility
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
                      handlePiPdfAction(
                        row.original._id,
                        row.original.piNumber,
                        "view",
                      )
                    }
                    disabled={piPdfLoading === row.original._id}
                  >
                    <Eye
                      className={`h-5 w-5 ${
                        piPdfLoading === row.original._id
                          ? "text-gray-400 animate-pulse"
                          : "text-slate-600"
                      } cursor-pointer`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">View PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 cursor-pointer"
                    onClick={() =>
                      handlePiPdfAction(
                        row.original._id,
                        row.original.piNumber,
                        "download",
                      )
                    }
                    disabled={piPdfLoading === row.original._id}
                  >
                    <Download
                      className={`h-5 w-5 ${
                        piPdfLoading === row.original._id
                          ? "text-gray-400 animate-pulse"
                          : "text-emerald-600"
                      } cursor-pointer`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Download PDF
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
          </div>
        ),
        enableHiding: false, // Actions column should always be visible
      },
    ],
    [navigate, piPdfLoading, getStatusColor, handlePiPdfAction, pagination],
  );

  const table = useReactTable<ProformaInvoiceAPI>({
    data: piData,
    columns: columns,
    pageCount: piPageCount,
    state: {
      pagination,
      sorting,
      columnVisibility: piColumnVisibility,
    },
    onColumnVisibilityChange: setPiColumnVisibility,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const MIN_PI_COLUMNS = 4; // Minimum dynamic columns to be visible
  const MAX_PI_COLUMNS = 6; // Maximum dynamic columns to be visible

  const handlePiColumnToggle = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) {
      return;
    }

    const isCurrentlyVisible = piColumnVisibility[columnId]; // Get visibility from state
    const hideableColumns = table
      .getAllLeafColumns()
      .filter((c) => c.getCanHide());

    // Calculate current visible hideable count based on the piColumnVisibility state
    let currentVisibleHideableCount = 0;
    for (const hideableCol of hideableColumns) {
      if (piColumnVisibility[hideableCol.id]) {
        currentVisibleHideableCount++;
      }
    }

    // Predict the next visible hideable count if the toggle were to happen
    let nextVisibleHideableCount = currentVisibleHideableCount;
    if (isCurrentlyVisible) {
      // If it's currently visible and we're trying to hide it
      nextVisibleHideableCount--;
    } else {
      // If it's currently hidden and we're trying to show it
      nextVisibleHideableCount++;
    }

    if (isCurrentlyVisible && nextVisibleHideableCount < MIN_PI_COLUMNS) {
      toast.warning(`At least ${MIN_PI_COLUMNS} columns must be visible!`);
      return;
    }
    if (!isCurrentlyVisible && nextVisibleHideableCount > MAX_PI_COLUMNS) {
      toast.warning(`Maximum ${MAX_PI_COLUMNS} columns can be visible!`);
      return;
    }
    column.toggleVisibility(!isCurrentlyVisible);
  };

  const getColumnLabel = (columnId: string): string => {
    switch (columnId) {
      case "serialNumber":
        return "S.No";
      case "piNumber":
        return "PI No";
      case "client":
        return "Client";
      case "companyName":
        return "Company Name";
      case "totalAmount":
        return "Amount";
      case "status":
        return "Status";
      case "validityDate":
        return "Validity Date";
      case "createdAt":
        return "Issue Date";
      case "actions":
        return "Actions";
      default:
        return columnId
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize each word
    }
  };

  const resetPiToDefaultColumns = () => {
    setPiColumnVisibility({
      serialNumber: true,
      piNumber: true,
      client: true,
      totalAmount: true,
      status: true,
      actions: true,
      companyName: false,
      validityDate: false,
      createdAt: false,
    });
    toast.success("Columns reset to default.");
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setGlobalFilter("");
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSorting([]);
    resetPiToDefaultColumns(); // Reset column visibility to default
    toast.info("Filters cleared");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* FILTERS SECTION */}
      <div className="p-4 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:max-w-md shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input // Updated placeholder text
            placeholder="Search PI No, Status, Client, or Company..."
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
                <SelectItem value="draft" className="text-base cursor-pointer">
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
            {/* Clear Filters Button */}
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

            {/* Column Visibility for PI Table */}
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
                    table.getVisibleLeafColumns().filter((c) => c.getCanHide())
                      .length
                  }
                  /{MAX_PI_COLUMNS})
                </div>
                <div className="max-h-65 overflow-y-auto px-1">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <div
                        key={column.id}
                        onClick={() => handlePiColumnToggle(column.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer hover:bg-gray-100 text-sm capitalize ${
                          column.getIsVisible()
                            ? "text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-sm capitalize">
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
                      onClick={resetPiToDefaultColumns}
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
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {piLoading ? (
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
                        "button, a, input, textarea, select, label",
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
                        cell.getContext(),
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
              <SelectTrigger className="h-10 w-24 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base cursor-pointer">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
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
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xs border-gray-300 h-8 px-3 transition-colors hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              <MoveLeft className="h-3 w-3 mr-1" /> Prev
            </Button>

            <div className="items-center space-x-1 flex sm:flex">
              {generatePagination(
                table.getState().pagination.pageIndex + 1,
                table.getPageCount(),
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
                ),
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
  );
};

export default PITablePage;
