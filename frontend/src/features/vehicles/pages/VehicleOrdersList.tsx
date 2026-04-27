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

const STATUS_META: Record<
  VehicleBookingStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Quotation Pending",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  quotation_uploaded: {
    label: "Awaiting Approval",
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
  "Awaiting Approval",
  "Approved",
  "Awaiting Chassis/Engine No.",
  "In Transit",
  "Delivered",
];

const statusLabelToRaw: Record<string, VehicleBookingStatus | "All"> = {
  All: "All",
  "Quotation Pending": "pending",
  "Awaiting Approval": "quotation_uploaded",
  Approved: "approved",
  "Awaiting Chassis/Engine No.": "payment_done",
  "In Transit": "chassis_received",
  Delivered: "delivered",
};

import { useAuth } from "../../../hooks/useAuth";

const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam } = useAuth();

  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusLabel, setStatusLabel] = useState("All");
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
  const [activeBooking, setActiveBooking] = useState<VehicleBookingItem | null>(null);

  const [clients, setClients] = useState<IClient[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);

  const statusValue = statusLabelToRaw[statusLabel] || "All";

  const fetchBookings = async () => {
    try {
      setLoading(true);
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
  }, [search, statusLabel, currentPage]);

  // Toast reminder for pending engine/chassis numbers
  useEffect(() => {
    const pendingCount = bookings.filter(
      (b) =>
        b.status === "payment_done" &&
        (!b.engineNumber || !b.chassisNumber),
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
  }, []);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await dealerApi.getAll();
        const dealerList = response.data || response || [];
        setDealers(Array.isArray(dealerList) ? dealerList : []);
      } catch {
        toast.error("Failed to load dealers");
      }
    };
    fetchDealers();
  }, []);

  const syncBooking = (updated: VehicleBookingItem) => {
    setBookings((current) =>
      current.map((item) => {
        if (item._id === updated._id) {
          // Preserve the populated orderId (with vehicleSnapshot) from the
          // existing list item, since update API responses return a plain
          // orderId string instead of the populated object.
          return { ...updated, orderId: item.orderId };
        }
        return item;
      }),
    );
    setActiveBooking((current) => {
      if (current && current._id === updated._id) {
        return { ...updated, orderId: current.orderId };
      }
      return current;
    });
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
    try {
      const updated = await vehicleBookingApi.updateStatus(booking._id, "delivered");
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

  const renderPrimaryAction = (booking: VehicleBookingItem) => {
    const orderId = getOrderId(booking);
    const primaryActionClass =
      "cursor-pointer inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white transition whitespace-nowrap shrink-0";

    switch (booking.status) {
      case "pending":
      case "rejected":
        return (
          <button
            onClick={() => booking.assignedDealerId ? openQuotationModal(booking) : toast.error("Please allot a dealer first")}
            className={`${primaryActionClass} ${booking.assignedDealerId ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-400 opacity-60 cursor-not-allowed'}`}
            title={booking.assignedDealerId ? "Upload Quotation" : "Allot dealer to upload quotation"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Quotation
          </button>
        );
      case "quotation_uploaded":
        return (
          <button
            onClick={() => booking.assignedDealerId ? openQuotationModal(booking) : toast.error("Please allot a dealer first")}
            className={`${primaryActionClass} ${booking.assignedDealerId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-400 opacity-60 cursor-not-allowed'}`}
            title={booking.assignedDealerId ? "Review Quotation" : "Allot dealer to review quotation"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Review Quotation
          </button>
        );
      case "approved":
        if (isSourcingTeam) return null;
        return (
          <button
            onClick={() => openPaymentModal(booking)}
            className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-700`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Confirm Booking
          </button>
        );
      case "payment_done":
        return (
          <button
            onClick={() =>
              navigate(`/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`)
            }
            className={`${primaryActionClass} bg-blue-600 hover:bg-blue-700`}
          >
            <FilePenLine size={14} />
            Add Engine/Chassis
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
      case "delivered":
        return (
          <button
            onClick={() =>
              navigate(`/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`)
            }
            className="cursor-pointer inline-flex h-10 min-w-[190px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Eye size={14} />
            View Details
          </button>
        );
      default:
        return null;
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Quotation Pending",
        value: bookings.filter((b) => b.status === "pending").length,
        tone: "bg-slate-100 text-slate-800",
      },
      {
        label: "Awaiting Approval",
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
    ],
    [bookings],
  );

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">
              Required Vehicles
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Track and manage required vehicles unit-wise
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold text-sm">
              {bookings.length} Vehicles
            </span>
            {!isSourcingTeam && (
              <button
                onClick={() => navigate("/vehicles/orders/add")}
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
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
              placeholder="Search vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-slate-50/30 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-8 pb-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="overflow-x-auto px-8 pb-8">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full table-fixed border-collapse bg-white text-center">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[30%]" />
                <col className="w-[14%]" />
                <col className="w-[46%]" />
              </colgroup>
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-6 py-4 align-middle">
                    Vehicle ID
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 align-middle">
                    Vehicle
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 align-middle">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 align-middle">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      Loading vehicles...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      No required vehicles found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, idx) => {
                    const orderData = getOrderSnapshot(booking);
                    const vehicleSnapshot = orderData?.vehicleSnapshot;
                    const brand = vehicleSnapshot?.brandName || "Unknown";
                    const model = vehicleSnapshot?.modelName || "";
                    const variant = vehicleSnapshot?.variant || "";
                    const statusMeta = STATUS_META[booking.status];
                    const globalIndex = total - ((currentPage - 1) * limit + idx);
                    const vehicleId = `VEH-${String(globalIndex).padStart(3, "0")}`;
                    const orderId = getOrderId(booking);

                    return (
                      <tr
                        key={booking._id}
                        className="align-middle transition-colors duration-200 hover:bg-blue-50/30"
                      >
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <div className="font-bold text-[#0f172a] dark:text-white text-[15px]">
                            {vehicleId}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-6 py-5 align-middle text-left">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {/* Engine/Chassis pending alert */}
                            {booking.status === "payment_done" && (!booking.engineNumber || !booking.chassisNumber) && (
                              <span title="Engine/Chassis number pending" className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                <CircleAlert size={10} className="mr-0.5" />
                                Missing#
                              </span>
                            )}
                            {/* Overdue delivery alert */}
                            {booking.deliveryDate && booking.status !== "delivered" && (() => {
                              const today = new Date(); today.setHours(0,0,0,0);
                              const d = new Date(booking.deliveryDate); d.setHours(0,0,0,0);
                              return today.getTime() > d.getTime();
                            })() && (
                              <span title="Delivery overdue" className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                <CircleAlert size={10} className="mr-0.5" />
                                Overdue
                              </span>
                            )}
                            {/* Upcoming delivery reminder */}
                            {booking.deliveryDate && booking.status !== "delivered" && (() => {
                              const today = new Date(); today.setHours(0,0,0,0);
                              const d = new Date(booking.deliveryDate); d.setHours(0,0,0,0);
                              return d.getTime() >= today.getTime();
                            })() && (
                              <span title="Upcoming delivery" className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                <Calendar size={10} className="mr-0.5" />
                                {Math.ceil((new Date(booking.deliveryDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000*60*60*24)) === 0 ? "Today" : `${Math.ceil((new Date(booking.deliveryDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000*60*60*24))}d`}
                              </span>
                            )}
                          </div>
                          <p className="truncate font-semibold text-slate-900">
                            {brand} {model}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {variant}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                            >
                              {statusMeta.label}
                            </span>
                            {booking.deliveryDate && booking.status !== "delivered" && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                {new Date(booking.deliveryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <div className="inline-flex items-center justify-center gap-3 whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              {booking.assignedDealerId && (
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                  Dealer
                                </span>
                              )}
                              <button
                                onClick={() => openDealerModal(booking)}
                                className={`cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                                  booking.assignedDealerId
                                    ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                                title={
                                  booking.assignedDealerId
                                    ? "Dealer Allotted"
                                    : "Allot Dealer"
                                }
                              >
                                <Store size={16} />
                                {booking.assignedDealerId
                                  ? booking.assignedDealerSnapshot?.name
                                  : "Allot Dealer"}
                              </button>
                            </div>
                            {renderPrimaryAction(booking)}
                              <div className="flex flex-col items-center gap-1">
                                {booking.assignedClientId && (
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                    Allotted to
                                  </span>
                                )}
                                <button
                                  onClick={() => !isSourcingTeam && openClientModal(booking)}
                                  disabled={isSourcingTeam}
                                  className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                                    isSourcingTeam
                                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                      : booking.assignedClientId
                                        ? "cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  }`}
                                  title={
                                    isSourcingTeam
                                      ? "Only Admin can allot client"
                                      : booking.assignedClientId
                                        ? "Client Allotted"
                                        : "Allot Client"
                                  }
                                >
                                  <Check size={16} />
                                  {booking.assignedClientId
                                    ? booking.assignedClientSnapshot?.name
                                    : "Allot Client"}
                                </button>
                              </div>
                            <button
                              onClick={() =>
                                navigate(
                                  `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                                )
                              }
                              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:scale-110 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm active:scale-95"
                              title="View Vehicle"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(
                                  `/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`,
                                )
                              }
                              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 transition-all duration-200 hover:scale-110 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm active:scale-95"
                              title="Edit Vehicle"
                            >
                              <FilePenLine size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-8 py-5 flex justify-between items-center bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Page{" "}
            <span className="text-[#0f172a] dark:text-white">
              {currentPage}
            </span>{" "}
            of {totalPages}
          </span>

          <div className="flex gap-6">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="cursor-pointer flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-blue-600 hover:-translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="cursor-pointer flex items-center gap-1 text-sm font-bold text-[#0f172a] hover:text-blue-600 hover:translate-x-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

      <ClientAllotModal
        isOpen={clientModalOpen}
        onClose={closeClientModal}
        booking={activeBooking}
        clients={clients}
        onSync={syncBooking}
      />

      <DealerAllotModal
        isOpen={dealerModalOpen}
        onClose={closeDealerModal}
        booking={activeBooking}
        dealers={dealers}
        onSync={syncBooking}
      />
    </div>
  );
};

export default VehicleOrdersList;

