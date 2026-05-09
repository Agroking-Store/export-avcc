import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { piApi } from "../components/piApi"; // Import piApi
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  SlidersHorizontal,
  Check,
  BrushCleaning, // For clear filters
  ChevronLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverClose,
  PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "react-toastify";
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
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  Inbox,
  Building2,
  User,
  ReceiptText,
  CalendarDays,
  MoveLeft,
  MoveRight,
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState, // Import VisibilityState
} from "@tanstack/react-table";

import { VehicleTracking, OrderDetailData } from "../components/pi.types"; // Import from pi.types
import VehiclePIViewModal from "../components/VehiclePIViewModal";

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

const CHART_COLORS = ["#10b981", "#f59e0b", "#e2e8f0"]; // Green (PI'd), Amber (Pending), Gray (Total)

const PIOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPI, setSelectedPI] = useState<any>(null);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const saved = localStorage.getItem("pi-order-detail-columns");
      return saved
        ? JSON.parse(saved)
        : {
            serialNumber: true,
            make: false, // Changed to false as per request
            model: true,
            chassisNo: false,
            engineNo: false, // Changed to false as per request
            dealerName: false,
            companyName: false, // Exporter name, hidden by default
            bookingStatus: true,
            piStatus: true,
            associatedPIs: false, // Changed to false as per request
            piCreationDate: true,
            actions: true,
          };
    },
  );

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await piApi.getOrderDetailWithTracking(orderId); // Use the new piApi function

        setOrderDetail(res);
      } catch (err) {
        console.error("Failed to fetch order details:", err);
        setError("Failed to load order details.");
        toast.error("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  // Effect to save column visibility to local storage

  const chartData = useMemo(() => {
    if (!orderDetail) return [];
    return [
      { name: "PI Generated", value: orderDetail.totalVehiclesPIed },
      { name: "Pending PI", value: orderDetail.pendingVehicles },
    ].filter((item) => item.value > 0);
  }, [orderDetail]);

  useEffect(() => {
    localStorage.setItem(
      "pi-order-detail-columns",
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  const columns = useMemo<ColumnDef<VehicleTracking>[]>(
    () => [
      {
        accessorKey: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">{row.index + 1}</div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "make",
        header: "Make",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap text-left block">
            {row.original.make}
          </span>
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap text-left block">
            {row.original.model}
          </span>
        ),
      },
      {
        accessorKey: "chassisNo", // Changed from chassisNumber
        header: "Chassis No.",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap text-left block font-mono">
            {row.original.chassisNo}
          </span>
        ),
      },
      {
        accessorKey: "engineNo", // Changed from engineNumber
        header: "Engine No.",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap text-left block font-mono">
            {row.original.engineNo}
          </span>
        ),
      },
      {
        accessorKey: "dealerName",
        header: "Dealer",
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-left block">
            {row.original.dealerName}
          </span>
        ),
      },
      {
        id: "companyName",
        header: "Company (Exporter)",
        cell: ({ row }) => {
          const company = row.original.associatedPIs?.[0]?.companyName;
          return (
            <span className="text-sm font-medium whitespace-nowrap text-left block">
              {company || "-"}
            </span>
          );
        },
      },
      {
        id: "associatedPIs",
        header: "Associated PI(s)",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 min-w-30">
            {row.original.associatedPIs.length > 0 ? (
              row.original.associatedPIs.map((pi) => (
                <TooltipProvider key={pi.piId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => navigate(`/proforma-invoice/${pi.piId}`)}
                      >
                        {pi.piNumber}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View PI {pi.piNumber}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        ),
      },
      {
        id: "piCreationDate",
        header: () => <div className="text-center">PI Date</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.associatedPIs.length > 0
              ? new Date(
                  row.original.associatedPIs[0].createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "bookingStatus",
        header: () => <div className="text-center">Booking Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                row.original.bookingStatus === "Booked"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {row.original.bookingStatus}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "piStatus", // Keep accessorKey as piStatus as it maps to the data
        header: () => <div className="text-center">PI Created</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                row.original.piStatus === "PI'd"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {row.original.piStatus}
            </span>
          </div>
        ),
      },
      // {
      //   id: "actions",
      //   header: () => <div className="text-center">Actions</div>,
      //   cell: ({ row }) => (
      //     <div className="flex justify-center gap-2">
      //       {row.original.piStatus === "Pending" && (
      //         <TooltipProvider>
      //           <Tooltip>
      //             <TooltipTrigger asChild>
      //               <span>
      //                 <Button
      //                   variant="outline"
      //                   size="sm"
      //                   className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      //                   disabled={row.original.bookingStatus !== "Booked"}
      //                   onClick={() =>
      //                     navigate(
      //                       `/proforma-invoice/add?orderId=${orderDetail?._id}&chassisNo=${row.original.chassisNo}`,
      //                     )
      //                   }
      //                 >
      //                   <Plus className="h-4 w-4 text-blue-600" />
      //                 </Button>
      //               </span>
      //             </TooltipTrigger>
      //             <TooltipContent>
      //               {row.original.bookingStatus === "Booked"
      //                 ? "Create PI for this vehicle"
      //                 : "Vehicle must be Booked to create PI"}
      //             </TooltipContent>
      //           </Tooltip>
      //         </TooltipProvider>
      //       )}
      //       {row.original.piStatus === "PI'd" &&
      //         row.original.associatedPIs.length > 0 && (
      //           <TooltipProvider>
      //             <Tooltip>
      //               <TooltipTrigger asChild>
      //                 <Button
      //                   variant="outline"
      //                   size="sm"
      //                   className="h-8 w-8 p-0"
      //                   onClick={() =>
      //                     navigate(
      //                       `/proforma-invoice/${row.original.associatedPIs[0].piId}`,
      //                     )
      //                   }
      //                 >
      //                   <Eye className="h-4 w-4 text-slate-600" />
      //                 </Button>
      //               </TooltipTrigger>
      //               <TooltipContent>View associated PI</TooltipContent>
      //             </Tooltip>
      //           </TooltipProvider>
      //         )}
      //     </div>
      //   ),
      //   enableHiding: false, // Actions column should always be visible
      // },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            {/* ... (Plus button logic) ... */}

            {row.original.piStatus === "PI'd" &&
              row.original.associatedPIs.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // INSTEAD OF NAVIGATE:
                          if (selectedPI) {
                            const modal = (
                              <VehiclePIViewModal
                                isOpen={isViewModalOpen}
                                onClose={() => {
                                  setIsViewModalOpen(false);
                                  setSelectedPI(null);
                                }}
                                piData={selectedPI}
                              />
                            );
                            setIsViewModalOpen(true);
                            return modal; // Return the modal component
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Proforma Invoice</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
          </div>
        ),
      },
    ],
    [navigate, orderDetail],
  );

  const MIN_VISIBLE_HIDEABLE_COLUMNS = 4; // Minimum dynamic columns to be visible
  const MAX_VISIBLE_HIDEABLE_COLUMNS = 6; // Changed from 8 to 6 as per request

  const handleColumnToggle = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;

    const isCurrentlyVisible = columnVisibility[columnId]; // Get visibility from state
    const hideableColumns = table
      .getAllLeafColumns()
      .filter((c) => c.getCanHide());

    // Calculate current visible hideable count based on the columnVisibility state
    let currentVisibleHideableCount = 0;
    for (const hideableCol of hideableColumns) {
      if (columnVisibility[hideableCol.id]) {
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

    if (
      isCurrentlyVisible &&
      nextVisibleHideableCount < MIN_VISIBLE_HIDEABLE_COLUMNS
    ) {
      toast.warning(
        `At least ${MIN_VISIBLE_HIDEABLE_COLUMNS} columns must be visible!`,
      );
      return;
    }
    if (
      !isCurrentlyVisible &&
      nextVisibleHideableCount > MAX_VISIBLE_HIDEABLE_COLUMNS
    ) {
      toast.warning(
        `Maximum ${MAX_VISIBLE_HIDEABLE_COLUMNS} columns can be visible!`,
      );
      return;
    }
    column.toggleVisibility(!isCurrentlyVisible);
  };

  const resetToDefaultColumns = () => {
    setColumnVisibility({
      serialNumber: true,
      make: false, // Set to false as per request
      model: true,
      chassisNo: false,
      engineNo: false, // Set to false as per request
      dealerName: false,
      companyName: false,
      bookingStatus: true,
      piStatus: true,
      associatedPIs: false, // Set to false as per request
      piCreationDate: true,
      actions: true,
    });
    toast.success("Columns reset to default.");
  };

  const getColumnLabel = (columnId: string): string => {
    switch (columnId) {
      case "serialNumber":
        return "S.No";
      case "make":
        return "Make";
      case "model":
        return "Model";
      case "chassisNo":
        return "Chassis No.";
      case "engineNo":
        return "Engine No.";
      case "dealerName":
        return "Dealer Name";
      case "companyName":
        return "Company (Exporter)";
      case "bookingStatus":
        return "Booking Status";
      case "piStatus":
        return "PI Created";
      case "associatedPIs":
        return "Associated PI(s)";
      case "piCreationDate":
        return "PI Date";
      case "actions":
        return "Actions";
      default:
        return columnId
          .replace(/([A-Z])/g, " $1")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const handleClearFilters = () => {
    // For PIOrderDetail, there are no search/sorting filters yet,
    // so this primarily resets column visibility.
    resetToDefaultColumns();
    toast.info("Filters cleared");
  };

  const table = useReactTable({
    data: orderDetail?.vehicleTracking || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnVisibility, // Add this
    },
    onColumnVisibilityChange: setColumnVisibility, // Add this
  });

  const handleViewPI = async (piId: string) => {
    try {
      // 1. Fetch the full PI object (which now contains the 'documents' field)
      const data = await piApi.getPIById(piId);

      // 2. Set it to state to open the modal
      setSelectedPI(data);
      setIsViewModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch PI details");
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Loading Order Details...
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 rounded mt-6"></div>
          <div className="space-y-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto text-gray-600">
        No order details found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="default"
            className="h-12 w-12 rounded-full border-gray-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-6" strokeWidth={2.5} />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Order Details: {orderDetail.orderId}
          </h1>
        </div>
      </div>

      {/* Main Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Client Info
              </p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {orderDetail.client.name}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {orderDetail.client.clientCode}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Dealer
              </p>
              <p className="text-lg font-bold text-gray-900">
                {orderDetail.dealer.name}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <ReceiptText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Voucher No.
              </p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {orderDetail.voucherNo}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CalendarDays className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Order Date
              </p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(orderDetail.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Completion Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-60">
          <h3 className="text-sm font-bold text-gray-700 mb-4 self-start">
            PI Completion Status
          </h3>
          <div className="w-full h-full min-h-45 relative flex items-center justify-center">
            {/* Center Label for Total Count */}
            <div className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-auto">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-4xl font-black text-gray-900 leading-none cursor-pointer hover:text-blue-600 transition-all duration-300">
                      {orderDetail.totalVehiclesInOrder}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                  >
                    Total Units
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  cornerRadius="50%"
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-600">
                PI'd: {orderDetail.totalVehiclesPIed}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-gray-600">
                Pending: {orderDetail.pendingVehicles}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Vehicle & PI Status Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Vehicle PI Tracking
          </h2>
          <div className="flex gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="h-9 w-9 p-0 shrink-0 rounded-md shadow-sm border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <BrushCleaning className="h-4 w-4 text-gray-500 cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  Clear Filters
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-9 p-0 shrink-0 rounded-md shadow-sm border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
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
                className="w-60 bg-white shadow-xl border rounded-xl z-50 flex flex-col"
              >
                <div className="text-xs font-semibold border-b px-3 py-2 text-gray-500">
                  Visible Columns (
                  {
                    table.getVisibleLeafColumns().filter((c) => c.getCanHide())
                      .length
                  }
                  /{MAX_VISIBLE_HIDEABLE_COLUMNS})
                </div>
                <div className="max-h-65 overflow-y-auto px-1">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <div
                        key={column.id}
                        onClick={() => handleColumnToggle(column.id)}
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
                      onClick={resetToDefaultColumns}
                    >
                      Reset to Default
                    </Button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-gray-50 text-gray-700 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
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
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-40 text-center p-4"
                  >
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl min-h-40 bg-gray-50 text-center p-8">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium text-lg">
                        No vehicles found for this order.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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

        {/* Pagination Section */}
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
              <span className="text-sm text-gray-500">items</span>
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

              <div className="items-center space-x-1 flex">
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

      <VehiclePIViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPI(null);
        }}
        piData={selectedPI}
      />
    </div>
  );
};

export default PIOrderDetail;
