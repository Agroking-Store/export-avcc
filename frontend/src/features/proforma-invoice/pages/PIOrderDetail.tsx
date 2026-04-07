import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Eye, Inbox } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import ProgressBar from "../../../components/common/ProgressBar"; // Import the shared ProgressBar

// Types for the Order Detail page
interface AssociatedPI {
  piId: string;
  piNumber: string;
  createdAt: string;
}

interface VehicleTracking {
  _id: string;
  make: string;
  model: string;
  chassisNumber: string;
  engineNumber: string;
  quantity: number;
  piStatus: "PI'd" | "Pending";
  associatedPIs: AssociatedPI[];
}

interface OrderDetailData {
  _id: string;
  orderId: string;
  voucherNo: string;
  client: { name: string; clientCode: string };
  dealer: { name: string };
  createdAt: string;
  totalVehiclesInOrder: number;
  totalVehiclesPIed: number;
  pendingVehicles: number;
  overallPIStatus: string;
  vehicleTracking: VehicleTracking[];
}

const PIOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(
          `${apiConfig.baseURL}/proforma-invoices/orders/${orderId}/details` // Updated endpoint
        );
        setOrderDetail(res.data);
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
          <span className="font-medium">{row.original.make}</span>
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.model}</span>
        ),
      },
      {
        accessorKey: "chassisNumber",
        header: "Chassis No.",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.chassisNumber}</span>
        ),
      },
      {
        accessorKey: "engineNumber",
        header: "Engine No.",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.engineNumber}</span>
        ),
      },
      {
        accessorKey: "piStatus",
        header: "PI Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              row.original.piStatus === "PI'd"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {row.original.piStatus}
          </span>
        ),
      },
      {
        id: "associatedPIs",
        header: "Associated PI(s)",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
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
        header: "PI Date",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.associatedPIs.length > 0
              ? new Date(
                  row.original.associatedPIs[0].createdAt
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
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            {row.original.piStatus === "Pending" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        navigate(
                          `/proforma-invoice/add?orderId=${orderDetail?._id}&chassisNumber=${row.original.chassisNumber}`
                        )
                      }
                    >
                      <Plus className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create PI for this vehicle</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {row.original.piStatus === "PI'd" &&
              row.original.associatedPIs.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          navigate(
                            `/proforma-invoice/${row.original.associatedPIs[0].piId}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View associated PI</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
          </div>
        ),
      },
    ],
    [navigate, orderDetail]
  );

  const table = useReactTable({
    data: orderDetail?.vehicleTracking || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Order Details: {orderDetail.orderId}
        </h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          Back
        </Button>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Voucher No.</p>
            <p className="font-medium text-gray-900">{orderDetail.voucherNo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium text-gray-900">
              {orderDetail.client.name} ({orderDetail.client.clientCode})
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dealer</p>
            <p className="font-medium text-gray-900">
              {orderDetail.dealer.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium text-gray-900">
              {new Date(orderDetail.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Overall PI Tracking Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
            Total Vehicles
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {orderDetail.totalVehiclesInOrder}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
            Vehicles PI'd
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {orderDetail.totalVehiclesPIed}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
            Vehicles Pending PI
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {orderDetail.pendingVehicles}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
            Overall PI Status
          </h3>
          <div className="mt-2">
            <ProgressBar
              value={
                orderDetail.totalVehiclesInOrder > 0
                  ? (orderDetail.totalVehiclesPIed /
                      orderDetail.totalVehiclesInOrder) *
                    100
                  : 0
              }
              statusText={orderDetail.overallPIStatus}
              colorClass={getPIProgressBarColor(orderDetail.overallPIStatus)}
            />
          </div>
        </div>
      </div>

      {/* Detailed Vehicle & PI Status Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            Vehicle PI Tracking
          </h2>
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
                            header.getContext()
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
      </div>
    </div>
  );
};

export default PIOrderDetail;
