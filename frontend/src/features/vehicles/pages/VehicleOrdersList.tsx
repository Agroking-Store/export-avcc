import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  FilePenLine,
  Filter,
  Plus,
  Search,
  Truck,
  CircleAlert,
  Calendar,
  Store,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { IClient } from "../../clients/clients.types";
import {
  VehicleBookingItem,
  VehicleBookingStatus,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import { dealerApi } from "../../../services/dealerApi";
import QuotationModal from "../components/QuotationModal";
import PaymentModal from "../components/PaymentModal";
import ClientAllotModal from "../components/ClientAllotModal";
import DealerAllotModal from "../components/DealerAllotModal";
import { useAuth } from "../../../hooks/useAuth";
import axios from "axios";
import { apiConfig } from "@/config/apiConfig";

const STATUS_META: Record<
  VehicleBookingStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  quotation_details_pending: {
    label: "Costing Details Pending",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  quotation_uploaded: {
    label: "Waiting for Approval",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
  },
  payment_done: {
    label: "Awaiting Chassis/Engine No.",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  chassis_received: {
    label: "In Transit",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
};

const statusOptions = [
  "All",
  "Quotation Pending",
  "Costing Details Pending",
  "Waiting for Approval",
  "Approved",
  "Awaiting Chassis/Engine No.",
  "In Transit",
  "Delivered",
  "PI Pending",
];

const statusLabelToRaw: Record<
  string,
  VehicleBookingStatus | "All" | "piPending"
> = {
  All: "All",
  "Quotation Pending": "pending",
  "Costing Details Pending": "quotation_details_pending",
  "Waiting for Approval": "quotation_uploaded",
  Approved: "approved",
  "Awaiting Chassis/Engine No.": "payment_done",
  "In Transit": "chassis_received",
  Delivered: "delivered",
  "PI Pending": "piPending",
};

interface ClientOrdersResponse {
  vehicleOrders?: VehicleBookingItem[];
}

const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam, isClient, isAdmin, isDealer } = useAuth();
  const canManageBookings = isAdmin || isDealer || isClient;

  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const rawToStatusLabel: Record<string, string> = {
    pending: "Quotation Pending",
    quotation_details_pending: "Costing Details Pending",
    quotation_uploaded: "Waiting for Approval",
    approved: "Approved",
    payment_done: "Awaiting Chassis/Engine No.",
    chassis_received: "In Transit",
    delivered: "Delivered",
    piPending: "PI Pending",
    missingClient: "All",
  };
  const incomingFilter = (location.state as any)?.statusFilter;
  const [statusLabel, setStatusLabel] = useState<string>(
    incomingFilter && rawToStatusLabel[incomingFilter]
      ? rawToStatusLabel[incomingFilter]
      : "All",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const lastToastMessage = useRef<string | null>(null);
  const lastReminderCount = useRef<number>(0);

  const limit = 10;

  // Modal states
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<VehicleBookingItem | null>(
    null,
  );

  const [clients, setClients] = useState<IClient[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);

  const statusValue = statusLabelToRaw[statusLabel] || "All";

  const fetchBookings = async () => {
    try {
      setLoading(true);
      if (isClient) {
        const response = await api.get<ClientOrdersResponse>("/clients/me");
        const clientBookings = Array.isArray(response.data?.vehicleOrders)
          ? response.data.vehicleOrders
          : [];
        const normalizedSearch = search.trim().toLowerCase();
        const filteredBookings = clientBookings.filter((booking) => {
          const hasNumbers =
            !!String(booking.engineNumber || "").trim() &&
            !!String(booking.chassisNumber || "").trim();
          const statusMatches =
            statusValue === "All" ||
            (statusValue === "piPending"
              ? hasNumbers && !booking.piGenerated
              : booking.status === statusValue);

          if (!statusMatches) return false;

          if (!normalizedSearch) return true;

          const orderData = (booking as any).orderId;
          const vehicleSnapshot =
            typeof orderData === "object" && orderData !== null
              ? orderData.vehicleSnapshot
              : null;
          const searchValue = [
            vehicleSnapshot?.brandName,
            vehicleSnapshot?.modelName,
            vehicleSnapshot?.variant,
            vehicleSnapshot?.color,
            booking.assignedDealerSnapshot?.name,
            STATUS_META[booking.status]?.label,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchValue.includes(normalizedSearch);
        });
        const nextTotal = filteredBookings.length;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
        const startIndex = (currentPage - 1) * limit;

        setBookings(filteredBookings.slice(startIndex, startIndex + limit));
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
        return;
      }

      const res = await vehicleBookingApi.getAllBookings({
        search,
        status: statusValue === "All" ? undefined : statusValue,
        page: currentPage,
        limit,
      });

      setBookings(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentPage, isClient, search, statusLabel]);

  useEffect(() => {
    const pendingCount = bookings.filter(
      (b) =>
        b.status === "payment_done" && (!b.engineNumber || !b.chassisNumber),
    ).length;

    if (pendingCount > 0 && pendingCount !== lastReminderCount.current) {
      toast.info(
        `${pendingCount} vehicle${pendingCount > 1 ? "s" : ""} still need engine/chassis numbers on this page.`,
      );
    }
    lastReminderCount.current = pendingCount;
  }, [bookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusLabel]);

  useEffect(() => {
    setTotal(0);
  }, [search, statusLabel]);

  useEffect(() => {
    if (location.state?.success) {
      const message = location.state.success as string;
      if (lastToastMessage.current !== message) {
        lastToastMessage.current = message;
        toast.success(message);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (isClient) return;
    const fetchClients = async () => {
      try {
        const response = await api.get("/clients", {
          params: { limit: 1000, page: 1 },
        });
        const clientList = response.data?.data || response.data || [];
        setClients(Array.isArray(clientList) ? clientList : []);
      } catch {
        toast.error("Failed to load clients");
      }
    };
    fetchClients();
  }, [isClient]);

  useEffect(() => {
    if (isClient) return;
    const fetchDealers = async () => {
      try {
        const response = await axios.get(
          `${apiConfig.baseURL}/dealers?limit=1000`,
        );
        const dealerList = response.data.data || response || [];
        setDealers(Array.isArray(dealerList) ? dealerList : []);
      } catch {
        toast.error("Failed to load dealers");
      }
    };
    fetchDealers();
  }, [isClient]);

  const syncBooking = (updated: VehicleBookingItem) => {
    setBookings((current) =>
      current.map((item) => {
        if (item._id === updated._id) {
          return { ...updated, orderId: item.orderId };
        }
        return item;
      }),
    );
  };

  const openQuotationModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setQuotationModalOpen(true);
  };

  const openPaymentModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setPaymentModalOpen(true);
  };

  const openClientModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setClientModalOpen(true);
  };

  const closeQuotationModal = () => {
    setQuotationModalOpen(false);
    setActiveBooking(null);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setActiveBooking(null);
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setActiveBooking(null);
  };

  const openDealerModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setDealerModalOpen(true);
  };

  const closeDealerModal = () => {
    setDealerModalOpen(false);
    setActiveBooking(null);
  };

  const handleMarkDelivered = async (booking: VehicleBookingItem) => {
    if (!booking.assignedClientId) {
      toast.error(
        "Please allot a client before marking this vehicle as delivered.",
      );
      return;
    }
    try {
      const updated = await vehicleBookingApi.updateStatus(
        booking._id,
        "delivered",
      );
      syncBooking(updated);
      toast.success("Vehicle marked as delivered");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getOrderId = (booking: VehicleBookingItem) => {
    const oid = (booking as any).orderId;
    return typeof oid === "string" ? oid : oid?._id || "";
  };

  const getOrderSnapshot = (booking: VehicleBookingItem) => {
    const oid = (booking as any).orderId;
    return typeof oid === "object" && oid !== null
      ? oid
      : { vehicleSnapshot: null, orderNumber: "" };
  };

  const getNumberActionLabel = (booking: VehicleBookingItem) => {
    const missingEngine = !String(booking.engineNumber || "").trim();
    const missingChassis = !String(booking.chassisNumber || "").trim();
    if (missingEngine && missingChassis) return "Add Engine/Chassis";
    if (missingEngine) return "Enter Engine";
    if (missingChassis) return "Enter Chassis";
    return "Review Numbers";
  };

  const renderPrimaryAction = (booking: VehicleBookingItem) => {
    const orderId = getOrderId(booking);
    const primaryActionClass =
      "cursor-pointer inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white transition whitespace-nowrap shrink-0";

    switch (booking.status) {
      case "pending":
      case "rejected":
        return (
          <button
            onClick={() =>
              booking.assignedDealerId
                ? openQuotationModal(booking)
                : toast.error("Please allot a dealer first")
            }
            className={`${primaryActionClass} ${booking.assignedDealerId ? "bg-slate-900 hover:bg-slate-700" : "bg-slate-400 opacity-60 cursor-not-allowed"}`}
          >
            Upload Quotation
          </button>
        );
      case "quotation_details_pending":
      case "quotation_uploaded":
        return (
          <button
            onClick={() =>
              booking.assignedDealerId
                ? openQuotationModal(booking)
                : toast.error("Please allot a dealer first")
            }
            className={`${primaryActionClass} ${booking.assignedDealerId ? (booking.status === "quotation_details_pending" ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600") : "bg-slate-400 opacity-60 cursor-not-allowed"}`}
          >
            {booking.status === "quotation_details_pending"
              ? "Add Costing"
              : "Review Quotation"}
          </button>
        );
      case "approved":
        return (
          <button
            onClick={() => !isSourcingTeam && openPaymentModal(booking)}
            disabled={isSourcingTeam}
            className={`inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition whitespace-nowrap shrink-0 ${isSourcingTeam ? "bg-slate-400 text-white cursor-not-allowed opacity-60" : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"}`}
          >
            Confirm Booking
          </button>
        );
      case "payment_done":
        return (
          <button
            onClick={() =>
              navigate(
                `/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`,
              )
            }
            className={`${primaryActionClass} bg-blue-600 hover:bg-blue-700`}
          >
            <FilePenLine size={14} />
            {getNumberActionLabel(booking)}
          </button>
        );
      case "chassis_received":
        return (
          <button
            onClick={() => handleMarkDelivered(booking)}
            className={`${primaryActionClass} bg-[#1e40af] hover:bg-[#1d4ed8]`}
          >
            <Truck size={14} />
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  /* ══════════════════════════════════════════════════════════
     SUMMARY CARDS LOGIC (CONDITIONAL FOR CLIENT)
     ══════════════════════════════════════════════════════════ */
  const summaryCards = useMemo(() => {
    if (isClient) {
      return [
        {
          label: "PI Pending",
          value: bookings.filter(
            (b) => !b.piGenerated && b.engineNumber && b.chassisNumber,
          ).length,
          tone: "bg-amber-100 text-amber-800",
        },
        {
          label: "LC Pending",
          value: bookings.filter(
            (b) => b.status === "approved" || b.status === "quotation_uploaded",
          ).length, // Example Logic
          tone: "bg-blue-100 text-blue-800",
        },
        {
          label: "Sourcing",
          value: bookings.filter((b) =>
            [
              "pending",
              "quotation_details_pending",
              "quotation_uploaded",
              "approved",
              "payment_done",
            ].includes(b.status),
          ).length,
          tone: "bg-slate-100 text-slate-800",
        },
        {
          label: "Delivered",
          value: bookings.filter((b) => b.status === "delivered").length,
          tone: "bg-emerald-100 text-emerald-800",
        },
        {
          label: "Awaiting VIN",
          value: bookings.filter(
            (b) => !b.chassisNumber && b.status !== "delivered",
          ).length,
          tone: "bg-rose-100 text-rose-800",
        },
      ];
    }
    // ORIGINAL ADMIN CARDS
    return [
      {
        label: "Quotation Pending",
        value: bookings.filter((b) => b.status === "pending").length,
        tone: "bg-slate-100 text-slate-800",
      },
      {
        label: "Costing Pending",
        value: bookings.filter((b) => b.status === "quotation_details_pending")
          .length,
        tone: "bg-blue-100 text-blue-800",
      },
      {
        label: "Waiting for Approval",
        value: bookings.filter((b) => b.status === "quotation_uploaded").length,
        tone: "bg-amber-100 text-amber-800",
      },
      {
        label: "Awaiting Numbers",
        value: bookings.filter((b) => b.status === "payment_done").length,
        tone: "bg-blue-100 text-blue-800",
      },
      {
        label: "Delivered",
        value: bookings.filter((b) => b.status === "delivered").length,
        tone: "bg-emerald-100 text-emerald-800",
      },
    ];
  }, [bookings, isClient]);

  const pageTitle = isClient ? "My Vehicle List" : "Vehicles List";
  const pageDescription = isClient
    ? "View the vehicle orders assigned to your account"
    : "Track and manage vehicle list unit-wise";
  const getAssignedClientLabel = (booking: VehicleBookingItem) =>
    booking.assignedClientSnapshot?.companyName ||
    booking.assignedClientSnapshot?.name ||
    "Allot Client";

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              {pageTitle}
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              {pageDescription}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold text-sm">
              {total} {total === 1 ? "Vehicle" : "Vehicles"}
            </span>
            {canManageBookings && (
              <button
                onClick={() => navigate("/vehicles/orders/add")}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                Add Required Vehicle
              </button>
            )}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-gray-800" />

        <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 z-10">
                <Filter size={16} />
              </div>
              <select
                value={statusLabel}
                onChange={(e) => setStatusLabel(e.target.value)}
                className="cursor-pointer appearance-none pl-11 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-blue-600 text-sm font-bold rounded-2xl outline-none transition-all hover:bg-slate-50 dark:hover:bg-gray-800"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Statuses" : item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder={
                isClient ? "Search your vehicle..." : "Search vehicle..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-8 pb-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <div
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${card.tone}`}
                >
                  {card.value} vehicles
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="min-w-full border-collapse bg-white text-center">
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-7 py-4 align-middle">
                    Vehicle ID
                  </th>
                  <th className="border-b border-slate-200 px-5 py-4 align-middle text-left">
                    Vehicle
                  </th>
                  <th className="border-b border-slate-200 px-5 py-4 align-middle">
                    Color
                  </th>
                  {/* CLIENT ONLY COLUMNS */}
                  {isClient && (
                    <>
                      <th className="border-b border-slate-200 px-5 py-4 align-middle">
                        Engine No
                      </th>
                      <th className="border-b border-slate-200 px-5 py-4 align-middle">
                        Chassis No
                      </th>
                    </>
                  )}
                  <th className="border-b border-slate-200 px-5 py-4 align-middle">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 align-middle">
                    {isClient ? "View" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={isClient ? 7 : 5}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      Loading vehicles...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isClient ? 7 : 5}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      {isClient
                        ? "No assigned vehicles found"
                        : "No required vehicles found"}
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, idx) => {
                    const orderData = getOrderSnapshot(booking);
                    const vehicleSnapshot = orderData?.vehicleSnapshot;
                    const brand = vehicleSnapshot?.brandName || "Unknown";
                    const model = vehicleSnapshot?.modelName || "";
                    const variant = vehicleSnapshot?.variant || "";
                    const color = vehicleSnapshot?.color || "-";
                    const statusMeta = STATUS_META[booking.status];
                    const globalIndex =
                      total - ((currentPage - 1) * limit + idx);
                    const vehicleId = `VEH-${String(globalIndex).padStart(3, "0")}`;
                    const orderId = getOrderId(booking);

                    return (
                      <tr
                        key={booking._id}
                        className="align-middle transition-colors duration-200 hover:bg-blue-50/30"
                      >
                        <td className="border-b border-slate-100 px-5 py-5 align-middle">
                          <div className="font-bold text-[#0f172a] text-[15px]">
                            {vehicleId}
                          </div>
                        </td>

                        <td className="border-b border-slate-100 px-5 py-5 align-middle text-left">
                          <p className="truncate max-w-[180px] font-semibold text-slate-900">
                            {brand} {model}
                          </p>
                          <p className="truncate max-w-[180px] text-sm text-slate-500">
                            {variant}
                          </p>
                        </td>

                        <td className="border-b border-slate-100 px-5 py-5 align-middle">
                          <span className="inline-flex max-w-[130px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            {color}
                          </span>
                        </td>

                        {/* CLIENT ONLY CELLS */}
                        {isClient && (
                          <>
                            <td className="border-b border-slate-100 px-5 py-5 align-middle font-mono text-xs text-slate-600">
                              {booking.engineNumber || "—"}
                            </td>
                            <td className="border-b border-slate-100 px-5 py-5 align-middle font-mono text-xs text-slate-600">
                              {booking.chassisNumber || "—"}
                            </td>
                          </>
                        )}

                        <td className="border-b border-slate-100 px-5 py-5 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          {isClient ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                                )
                              }
                              className="cursor-pointer inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Eye size={14} /> View Details
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex flex-col items-center gap-1 min-w-[130px]">
                                <button
                                  onClick={() => openDealerModal(booking)}
                                  className={`cursor-pointer inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${booking.assignedDealerId ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white"}`}
                                >
                                  <Store size={14} />
                                  <span className="truncate max-w-[90px]">
                                    {booking.assignedDealerId
                                      ? booking.assignedDealerSnapshot?.name
                                      : "Allot Dealer"}
                                  </span>
                                </button>
                              </div>
                              <div className="h-8 w-px bg-slate-200 shrink-0" />
                              <div className="shrink-0">
                                {renderPrimaryAction(booking)}
                              </div>
                              <div className="h-8 w-px bg-slate-200 shrink-0" />
                              <button
                                onClick={() =>
                                  !isSourcingTeam && openClientModal(booking)
                                }
                                className={`inline-flex h-9 min-w-[130px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs cursor-pointer font-semibold transition ${booking.assignedClientId ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white"}`}
                              >
                                <Check size={14} />
                                <span className="truncate max-w-[90px]">
                                  {booking.assignedClientId
                                    ? getAssignedClientLabel(booking)
                                    : "Allot Client"}
                                </span>
                              </button>
                              <div className="h-8 w-px bg-slate-200 shrink-0" />
                              <button
                                onClick={() =>
                                  navigate(
                                    `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                                  )
                                }
                                className="h-9 w-9 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-blue-50 transition-all cursor-pointer"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`,
                                  )
                                }
                                className="h-9 w-9 border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              >
                                <FilePenLine size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-5 flex justify-between items-center bg-white dark:bg-gray-900 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-500">
            Page <span className="text-[#0f172a]">{currentPage}</span> of{" "}
            {totalPages}
          </span>
          <div className="flex gap-6">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-sm font-bold text-slate-600 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-sm font-bold text-[#0f172a] disabled:opacity-30 transition-all"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <QuotationModal
        isOpen={quotationModalOpen}
        onClose={closeQuotationModal}
        booking={activeBooking}
        onSync={syncBooking}
      />
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={closePaymentModal}
        booking={activeBooking}
        onSync={syncBooking}
      />
      {!isClient && (
        <ClientAllotModal
          isOpen={clientModalOpen}
          onClose={closeClientModal}
          booking={activeBooking}
          clients={clients}
          onSync={syncBooking}
        />
      )}
      {!isClient && (
        <DealerAllotModal
          isOpen={dealerModalOpen}
          onClose={closeDealerModal}
          booking={activeBooking}
          dealers={dealers}
          onSync={syncBooking}
        />
      )}
    </div>
  );
};

export default VehicleOrdersList;
