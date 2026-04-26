import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Eye,
  FilePenLine,
  FileText,
  Filter,
  IndianRupee,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { apiConfig } from "../../../config/apiConfig";
import api from "../../../services/api";
import { IClient } from "../../clients/clients.types";
import {
  VehicleBookingItem,
  VehicleBookingStatus,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";

const API_ORIGIN = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");

const getQuotationUrl = (filePath?: string) =>
  filePath ? `${API_ORIGIN}${filePath}` : "";

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

const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusLabel, setStatusLabel] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const lastToastMessage = useRef<string | null>(null);

  const limit = 10;

  // Modal states
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<VehicleBookingItem | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [quotationSaving, setQuotationSaving] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSaving, setClientSaving] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, statusLabel, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
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

  const syncBooking = (updated: VehicleBookingItem) => {
    setBookings((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );
    setActiveBooking(updated);
  };

  const openQuotationModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setSelectedFile(null);
    setRejectReason(booking.rejectionReason || "");
    setQuotationModalOpen(true);
  };

  const openPaymentModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setPaymentAmount(booking.paymentAmount ? String(booking.paymentAmount) : "");
    setPaymentModalOpen(true);
  };

  const openClientModal = (booking: VehicleBookingItem) => {
    setActiveBooking(booking);
    setSelectedClientId(booking.assignedClientId || "");
    setClientModalOpen(true);
  };

  const closeQuotationModal = () => {
    setQuotationModalOpen(false);
    setActiveBooking(null);
    setSelectedFile(null);
    setRejectReason("");
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setActiveBooking(null);
    setPaymentAmount("");
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setActiveBooking(null);
    setSelectedClientId("");
  };

  const handleQuotationUpload = async () => {
    if (!activeBooking) return;
    if (!selectedFile) {
      toast.error("Please choose a quotation file");
      return;
    }

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.uploadQuotation(
        activeBooking._id,
        selectedFile,
      );
      syncBooking(updated);
      toast.success(
        activeBooking.quotationFile
          ? "Quotation replaced successfully"
          : "Quotation uploaded successfully",
      );
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload quotation");
    } finally {
      setQuotationSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!activeBooking) return;

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.approve(activeBooking._id);
      syncBooking(updated);
      toast.success("Vehicle approved");
      closeQuotationModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Approval failed");
    } finally {
      setQuotationSaving(false);
    }
  };

  const handleReject = async () => {
    if (!activeBooking) return;
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setQuotationSaving(true);
      const updated = await vehicleBookingApi.reject(
        activeBooking._id,
        rejectReason,
      );
      syncBooking(updated);
      toast.success("Vehicle rejected");
      closeQuotationModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Rejection failed");
    } finally {
      setQuotationSaving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!activeBooking) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Dealer amount is required");
      return;
    }

    try {
      setPaymentSaving(true);
      const updated = await vehicleBookingApi.confirmPayment(
        activeBooking._id,
        amount,
      );
      syncBooking(updated);
      toast.success("Payment saved and booking confirmed");
      closePaymentModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Payment confirmation failed");
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleAssignClient = async () => {
    if (!activeBooking) return;
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    try {
      setClientSaving(true);
      const updated = await vehicleBookingApi.assignClient(
        activeBooking._id,
        selectedClientId,
      );
      syncBooking(updated);
      toast.success("Client allotted successfully");
      closeClientModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to allot client");
    } finally {
      setClientSaving(false);
    }
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
            onClick={() => openQuotationModal(booking)}
            className={`${primaryActionClass} bg-slate-900 hover:bg-slate-700`}
          >
            <Upload size={14} />
            Upload Quotation
          </button>
        );
      case "quotation_uploaded":
        return (
          <button
            onClick={() => openQuotationModal(booking)}
            className={`${primaryActionClass} bg-amber-500 hover:bg-amber-600`}
          >
            <FileText size={14} />
            Review Quotation
          </button>
        );
      case "approved":
        return (
          <button
            onClick={() => openPaymentModal(booking)}
            className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-700`}
          >
            <IndianRupee size={14} />
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
            <button
              onClick={() => navigate("/vehicles/orders/add")}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Add Required Vehicle
            </button>
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
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[34%]" />
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
                    Color
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
                      colSpan={5}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      Loading vehicles...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      No required vehicles found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, idx) => {
                    const orderData = getOrderSnapshot(booking);
                    const vehicleSnapshot = orderData?.vehicleSnapshot;
                    const color = vehicleSnapshot?.color || "N/A";
                    const brand = vehicleSnapshot?.brandName || "Unknown";
                    const model = vehicleSnapshot?.modelName || "";
                    const variant = vehicleSnapshot?.variant || "";
                    const statusMeta = STATUS_META[booking.status];
                    const globalIndex = (currentPage - 1) * limit + idx + 1;
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
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <p className="truncate font-semibold text-slate-900">
                            {brand} {model}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {variant}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <div className="inline-flex items-center justify-center gap-3 text-sm text-slate-600">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate">{color}</span>
                          </div>
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
                          <div className="inline-flex items-center justify-center gap-3">
                            {renderPrimaryAction(booking)}
                            <div className="flex flex-col items-center gap-1">
                              {booking.assignedClientId && (
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                  Allotted to
                                </span>
                              )}
                              <button
                                onClick={() => openClientModal(booking)}
                                className={`cursor-pointer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                                  booking.assignedClientId
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                                title={
                                  booking.assignedClientId
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

      {/* ── Quotation Modal ── */}
      {quotationModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Unit {activeBooking.vehicleIndex + 1}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Quotation Upload & Approval
                </h3>
              </div>
              <button
                onClick={closeQuotationModal}
                className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Upload zone */}
              <div className="rounded-[24px] border border-dashed border-blue-300 bg-blue-50/70 p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 rounded-full bg-white p-3 text-blue-700 shadow-sm">
                    <Upload size={20} />
                  </div>
                  <p className="text-base font-semibold text-slate-900">
                    Upload quotation file
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    PDF, JPG, PNG, WebP supported. Replacing a file removes the old one automatically.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(event) =>
                      setSelectedFile(event.target.files?.[0] || null)
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    <Upload size={16} />
                    Choose File
                  </button>

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {selectedFile?.name ||
                      (activeBooking.quotationFile
                        ? "Existing quotation already uploaded"
                        : "No file selected")}
                  </p>
                </div>
              </div>

              {/* View existing quotation */}
              {activeBooking.quotationFile && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <FileText size={18} className="text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    Existing quotation available for this unit.
                  </p>
                  <button
                    onClick={() =>
                      window.open(getQuotationUrl(activeBooking.quotationFile), "_blank")
                    }
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Eye size={14} />
                    View File
                  </button>
                </div>
              )}

              {/* Upload / Replace action */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleQuotationUpload}
                  disabled={quotationSaving}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={16} />
                  {activeBooking.quotationFile ? "Replace File" : "Upload File"}
                </button>
              </div>

              {/* Approval actions – only shown when quotation is uploaded and awaiting approval */}
              {activeBooking.quotationFile &&
                activeBooking.status === "quotation_uploaded" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center gap-2 text-slate-800">
                      <ShieldCheck size={18} />
                      <p className="font-semibold">Approval Actions</p>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        rows={3}
                        placeholder="Enter rejection reason if needed..."
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={quotationSaving}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={quotationSaving}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {paymentModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Unit {activeBooking.vehicleIndex + 1}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Confirm Booking Payment
                </h3>
              </div>
              <button
                onClick={closePaymentModal}
                className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount paid to dealer
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                  placeholder="Enter payment amount"
                />
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={paymentSaving}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IndianRupee size={16} />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Allot Modal ── */}
      {clientModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Unit {activeBooking.vehicleIndex + 1}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Allot Client
                </h3>
              </div>
              <button
                onClick={closeClientModal}
                className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Client
                </label>
                <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 cursor-pointer"
                    >
                      <span className={selectedClientId ? "text-slate-700" : "text-slate-400"}>
                        {selectedClientId
                          ? (() => {
                              const client = clients.find((c) => c._id === selectedClientId);
                              return client
                                ? `${client.name}${client.companyName ? ` - ${client.companyName}` : ""}`
                                : "Choose client...";
                            })()
                          : "Choose client..."}
                      </span>
                      <ChevronsUpDown size={16} className="text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search client..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => {
                            const clientLabel = `${client.name}${client.companyName ? ` - ${client.companyName}` : ""}`;
                            return (
                              <CommandItem
                                key={client._id}
                                value={clientLabel}
                                onSelect={() => {
                                  setSelectedClientId(client._id);
                                  setClientPopoverOpen(false);
                                }}
                              >
                                {clientLabel}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedClientId === client._id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {activeBooking.assignedClientSnapshot?.name && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  Current allotment: {activeBooking.assignedClientSnapshot.name}
                  {activeBooking.assignedClientSnapshot.companyName
                    ? ` - ${activeBooking.assignedClientSnapshot.companyName}`
                    : ""}
                </div>
              )}

              <button
                onClick={handleAssignClient}
                disabled={clientSaving}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={16} />
                Allot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleOrdersList;