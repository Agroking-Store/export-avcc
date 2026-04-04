import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Search,
  BrushCleaning,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  FilePenLine,
  Trash2,
  ChevronsUpDown,
  SlidersHorizontal,
  Check,
  Eye,
  Download,
} from "lucide-react";
import {
  getCoreRowModel,
  useReactTable,
  PaginationState,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider, // Ensure TooltipProvider is imported if not already
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
import Swal from "sweetalert2";
import PIListTable, { ProformaInvoice } from "../components/PIListTable";
import OrderListTable, {
  OrderWithPIStatus,
} from "../components/OrderListTable";
import ProgressBar from "../../../components/common/ProgressBar"; // Import the shared ProgressBar

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

const PIList = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pi"); // 'pi' or 'order'
  // PI List specific states
  const [piData, setPiData] = useState<ProformaInvoice[]>([]);
  const [piLoading, setPiLoading] = useState(false);
  const [piPdfLoading, setPiPdfLoading] = useState<string | null>(null);
  // Order List specific states
  const [orderData, setOrderData] = useState<OrderWithPIStatus[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  // Table Server-Side States
  const [piPageCount, setPiPageCount] = useState(-1);
  const [orderPageCount, setOrderPageCount] = useState(-1);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [orderGlobalFilter, setOrderGlobalFilter] = useState(""); // Separate filter for orders
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderColumnVisibility, setOrderColumnVisibility] =
    useState<VisibilityState>(() => {
      const saved = localStorage.getItem("order-list-columns");
      return saved
        ? JSON.parse(saved)
        : {
            // Default visible columns as per request
            serialNumber: true,
            orderId: true,
            voucherNo: true, // Added to default visible
            clientName: true,
            piProgress: true,
            overallPIStatus: false, // Hidden by default
            createdAt: false, // Hidden by default
            updatedAt: false, // Hidden by default
          };
    });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]); // Default sort by createdAt descending
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Debounce search input to avoid slamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setOrderGlobalFilter(searchInput); // Apply search to both tabs
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset page for both
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page 1 when tab changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeTab]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter]);

  // Effect to save column visibility to local storage
  useEffect(() => {
    localStorage.setItem(
      "order-list-columns",
      JSON.stringify(orderColumnVisibility)
    );
  }, [orderColumnVisibility]);
  const handleClearFilters = () => {
    setSearchInput("");
    setGlobalFilter("");
    setStatusFilter("all");
    setOrderGlobalFilter("");
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    resetOrderToDefaultColumns(); // Also reset column visibility for orders
    toast.info("Filters cleared");
  };

  const fetchPIs = useCallback(async () => {
    try {
      setPiLoading(true);
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

      setPiData(res.data.data);
      setPiPageCount(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
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
    if (activeTab === "pi") {
      fetchPIs();
    } else {
      fetchOrdersWithPIStatus();
    }
  }, [activeTab, fetchPIs, fetchOrdersWithPIStatus]);

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

  const getPIProgressBarColor = (status: string) => {
    switch (status) {
      case "Fully PI'd":
        return "bg-green-500";
      case "Partially PI'd":
        return "bg-amber-500";
      case "Not Started":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
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

  const handlePiPdfAction = async (
    id: string,
    piNumber: string,
    action: "view" | "download"
  ) => {
    try {
      setPiPdfLoading(id);
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

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`,
        {
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      if (action === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${piNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        toast.success("PDF Downloaded successfully!");
      }
    } catch (error) {
      console.error("PDF Action Error", error);
      toast.error("Failed to process PDF");
    } finally {
      setPiPdfLoading(null);
    }
  };

  // Column definitions for PIListTable
  const columns = useMemo<ColumnDef<ProformaInvoice>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {table.getState().pagination.pageIndex *
              // @ts-ignore - table is for PIListTable, not orderTable here
              table.getState().pagination.pageSize +
              row.index +
              1}
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
            $
            {row.original.totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
                      handlePiPdfAction(
                        row.original._id,
                        row.original.piNumber,
                        "view"
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
                        "download"
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
    [navigate, handleDelete, piPdfLoading, getStatusColor, handlePiPdfAction]
  );

  const table = useReactTable<ProformaInvoice>({
    data: piData,
    columns: columns,
    pageCount: piPageCount,
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

  // Column definitions for OrderListTable
  const orderColumns = useMemo<ColumnDef<OrderWithPIStatus>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {table.getState().pagination.pageIndex * // Use the shared pagination state
              table.getState().pagination.pageSize +
              row.index +
              1}
          </div>
        ),
        enableHiding: false, // Serial number should always be visible
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
        // Header button content is left-aligned by default flex behavior
        id: "orderId",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.orderId}</span>
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
        // Header button content is left-aligned by default flex behavior
        id: "voucherNo",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.voucherNo}</span>
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
        // Header button content is left-aligned by default flex behavior
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.client?.name}</div>
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
        // Header button content is centered due to justify-center w-full
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.original.dealer?.name}
          </div>
        ),
      },
      {
        id: "piProgress",
        header: () => (
          <div className="text-center font-bold text-gray-700">PI Progress</div>
        ), // Explicitly center header
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
        // Header button content is centered due to justify-center w-full
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
        // Header button content is centered due to justify-center w-full
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
        ), // Explicitly center header
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
    [getStatusColor, getPIProgressBarColor]
  );

  const orderTable = useReactTable<OrderWithPIStatus>({
    data: orderData,
    columns: orderColumns,
    pageCount: orderPageCount,
    state: {
      pagination, // Use the shared pagination state
      sorting, // Use the shared sorting state
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

  const MIN_ORDER_COLUMNS = 4; // Minimum dynamic columns to be visible for order table
  const MAX_ORDER_COLUMNS = 6; // Maximum dynamic columns to be visible for order table

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

  // KPI Data for the overall page
  const kpiData = [
    {
      title: "Active Pipeline Value",
      value: "$2.4M",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Pending Approval",
      value: "14 Deals",
      trend: "-2.4%",
      trendUp: false,
    },
    {
      title: "Secured Deals (LC)",
      value: "45 Deals",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "At-Risk / Expiring",
      value: "6 PIs",
      trend: "+1.2%",
      trendUp: false, // For expiring deals, an upward trend is negative
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Proforma Invoices
        </h1>
        <Button
          onClick={() => navigate("/proforma-invoice/add")}
          className="h-10 px-4 shrink-0 rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-1 sm:flex-none cursor-pointer"
        >
          <Plus className="h-4 w-4 sm:mr-2 cursor-pointer" />
          <span className="hidden sm:inline">Create PI</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* PREMIUM KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow duration-200"
          >
            {/* Row 1: Title */}
            <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
              {kpi.title}
            </h3>

            {/* Row 2: Value */}
            <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
              {kpi.value}
            </p>

            {/* Row 3: Trend Rate Pill */}
            <div className="flex items-center mt-auto">
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  kpi.trendUp
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {kpi.trendUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {kpi.trend}
              </div>
              <span className="text-xs text-gray-400 ml-2 font-medium">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full lg:w-fit grid-cols-2 h-10 mb-4">
          <TabsTrigger value="pi" className="text-base">
            PI Perspective
          </TabsTrigger>
          <TabsTrigger value="order" className="text-base">
            Order Perspective
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pi" className="mt-0">
          {" "}
          {/* Removed mt-0 as it's not needed here */}
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
                      <SelectItem
                        value="all"
                        className="text-base cursor-pointer"
                      >
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
                </div>
              </div>{" "}
              {/* End of Actions */}
            </div>{" "}
            {/* End of filters and tabs header */}
            <PIListTable
              loading={piLoading}
              navigate={navigate}
              table={table}
              generatePagination={generatePagination}
            />
          </div>
        </TabsContent>
        <TabsContent value="order" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* FILTERS SECTION for Order Perspective */}
            <div className="p-4 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:max-w-md shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Order ID, Client, Dealer..."
                  value={searchInput} // Use shared searchInput
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
            <OrderListTable
              loading={orderLoading}
              table={orderTable}
              generatePagination={generatePagination}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PIList;
