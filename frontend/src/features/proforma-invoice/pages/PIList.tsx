import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Search, // Keep Search for global filter
  BrushCleaning,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  FilePenLine,
  Trash2,
  ChevronsUpDown,
  Eye,
  Download,
} from "lucide-react"; // Added imports for column actions
import {
  getCoreRowModel,
  useReactTable,
  PaginationState,
  ColumnDef, // Added ColumnDef import
  SortingState,
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
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import PIListTable, { ProformaInvoice } from "../components/PIListTable"; // Import the new component
import OrderListTable from "../components/OrderListTable"; // Import the new component

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

  // Table Server-Side States
  const [piPageCount, setPiPageCount] = useState(-1);
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
      // Only reset to page 1 on search if the current tab is "pi"
      if (activeTab === "pi") {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
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
            <OrderListTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PIList;
