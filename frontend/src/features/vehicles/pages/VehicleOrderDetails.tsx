import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  CircleAlert,
  Eye,
  FilePenLine,
  FileText,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
  Ship,
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
  VehicleOrderItem,
  vehicleManagementApi,
} from "../vehicleManagementApi";
import {
  VehicleBookingItem,
  VehicleBookingStatus,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
import QuotationModal from "../components/QuotationModal";

const API_ORIGIN = apiConfig.baseURL.replace(/\/api\/v1\/?$/, "");
const REMINDER_CHECK_MINUTES = 2;
const REMINDER_DUE_HOURS = 2;

const STATUS_META: Record<
  VehicleBookingStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: "Quotation Pending",
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
    label: "Ready to Ship",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
};

const getQuotationUrl = (filePath?: string) =>
  filePath ? `${API_ORIGIN}${filePath}` : "";

const VehicleOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [order, setOrder] = useState<VehicleOrderItem | null>(null);
  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const reminderToastCount = useRef(0);

  const fetchData = async (showLoader = false) => {
    if (!id) return;

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [orderRes, bookingRes] = await Promise.all([
        vehicleManagementApi.getVehicleOrderById(id),
        vehicleBookingApi.getByOrder(id),
      ]);

      setOrder(orderRes);
      setBookings(Array.isArray(bookingRes) ? bookingRes : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load vehicle order");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReminders = async () => {
    if (!id) return;

    try {
      const due = await vehicleBookingApi.getDueReminders(id, REMINDER_DUE_HOURS);
      if (due.length > reminderToastCount.current) {
        toast.info(
          `${due.length} vehicle${due.length > 1 ? "s" : ""} still need engine/chassis numbers.`,
        );
      }
      reminderToastCount.current = due.length;
    } catch {
      // Keep reminder polling silent
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetchReminders();
    const interval = window.setInterval(() => {
      fetchData(false);
      fetchReminders();
    }, REMINDER_CHECK_MINUTES * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [id]);

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

  const units = useMemo(() => {
    if (!order) return [];

    return Array.from({ length: order.quantity }, (_, vehicleIndex) => {
      const booking =
        bookings.find((item) => item.vehicleIndex === vehicleIndex) || null;

      return {
        booking,
        vehicleIndex,
        unitNo: vehicleIndex + 1,
        name: `${order.vehicleSnapshot.brandName} ${order.vehicleSnapshot.modelName}`.trim(),
        variant: order.vehicleSnapshot.variant,
        color: order.vehicleSnapshot.color,
      };
    });
  }, [bookings, order]);

  const pendingReminderUnits = useMemo(
    () =>
      units.filter(
        ({ booking }) =>
          booking?.status === "payment_done" &&
          (!booking.engineNumber || !booking.chassisNumber),
      ),
    [units],
  );

  const upcomingDeliveryReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return units
      .filter(
        ({ booking }) =>
          booking?.deliveryDate &&
          booking.status !== "delivered",
      )
      .map(({ booking, unitNo }) => {
        const delivery = new Date(booking!.deliveryDate!);
        delivery.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(
          (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return { booking, unitNo, diffDays };
      })
      .filter(({ diffDays }) => diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [units]);

  const overdueDeliveryAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return units
      .filter(
        ({ booking }) =>
          booking?.deliveryDate &&
          booking.status !== "delivered",
      )
      .map(({ booking, unitNo }) => {
        const delivery = new Date(booking!.deliveryDate!);
        delivery.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(
          (today.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24),
        );
        return { booking, unitNo, diffDays };
      })
      .filter(({ diffDays }) => diffDays > 0)
      .sort((a, b) => b.diffDays - a.diffDays);
  }, [units]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Quotation Pending",
        value: units.filter(({ booking }) => booking?.status === "pending").length,
        tone: "bg-slate-100 text-slate-800",
      },
      {
        label: "Waiting for Approval",
        value: units.filter(({ booking }) => booking?.status === "quotation_uploaded")
          .length,
        tone: "bg-amber-100 text-amber-800",
      },
      {
        label: "Awaiting Numbers",
        value: units.filter(({ booking }) => booking?.status === "payment_done").length,
        tone: "bg-blue-100 text-blue-800",
      },
      {
        label: "Delivered",
        value: units.filter(({ booking }) => booking?.status === "delivered").length,
        tone: "bg-emerald-100 text-emerald-800",
      },
    ],
    [units],
  );

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

  const syncBooking = (updated: VehicleBookingItem) => {
    setBookings((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );
    setActiveBooking(updated);
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
    if (!booking.assignedClientId) {
      toast.error("Please allot a client before marking this vehicle as delivered.");
      return;
    }
    try {
      const updated = await vehicleBookingApi.updateStatus(booking._id, "delivered");
      setBookings((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      toast.success("Vehicle marked as delivered");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getShipDisabledReason = (booking: VehicleBookingItem) => {
    const readiness = booking.invoiceReadiness;
    if (!booking.chassisNumber || !booking.engineNumber) {
      return "Engine and chassis numbers are required before shipping.";
    }
    if (!readiness?.INR) return "Generate INR invoice first.";
    if (!readiness?.USD) return "Generate USD invoice first.";
    if (!readiness?.COMMERCIAL) return "Generate commercial invoice first.";
    if (!readiness?.PACKING_LIST) return "Generate packing list first.";
    return "";
  };

  const handleShipVehicle = async (booking: VehicleBookingItem) => {
    const disabledReason = getShipDisabledReason(booking);
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }

    try {
      const updated = await vehicleBookingApi.updateStatus(booking._id, "shipped");
      setBookings((current) =>
        current.map((item) => (item._id === updated._id ? updated : item)),
      );
      toast.success("Vehicle marked as shipped");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to ship vehicle");
    }
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
      case "quotation_details_pending":
      case "quotation_uploaded":
        return (
          <button
            onClick={() => openQuotationModal(booking)}
            className={`${primaryActionClass} ${
              booking.status === "quotation_details_pending"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            <FileText size={14} />
            {booking.status === "quotation_details_pending"
              ? "Add Costing"
              : "Review Quotation"}
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
              navigate(`/vehicles/orders/${id}/unit-edit/${booking.vehicleIndex}`)
            }
            className={`${primaryActionClass} bg-blue-600 hover:bg-blue-700`}
          >
            <FilePenLine size={14} />
            {getNumberActionLabel(booking)}
          </button>
        );
      case "chassis_received":
        {
          const disabledReason = getShipDisabledReason(booking);
          return (
            <button
              onClick={() => handleShipVehicle(booking)}
              disabled={!!disabledReason}
              title={disabledReason || "Ship Vehicle"}
              className={`inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold text-white transition whitespace-nowrap shrink-0 ${
                disabledReason
                  ? "cursor-not-allowed bg-slate-400 opacity-60"
                  : "cursor-pointer bg-cyan-600 hover:bg-cyan-700"
              }`}
            >
              <Ship size={14} />
              Ship Vehicle
            </button>
          );
        }
      case "shipped":
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
              navigate(`/vehicles/orders/${id}/unit-view/${booking.vehicleIndex}`)
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

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading vehicle order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Vehicle order not found.
      </div>
    );
  }

  const getAssignedClientLabel = (booking: VehicleBookingItem | null) =>
    booking?.assignedClientSnapshot?.companyName ||
    booking?.assignedClientSnapshot?.name ||
    "Allot Client";

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {order.orderNumber}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {order.vehicleSnapshot.brandName} {order.vehicleSnapshot.modelName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {order.vehicleSnapshot.variant} · {order.vehicleSnapshot.color} · {order.quantity} units
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Client: {order.clientSnapshot?.name || "Not assigned"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchData(false)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/vehicles/orders")}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>
          </div>
        </div>

        {pendingReminderUnits.length > 0 && (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CircleAlert size={18} className="mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">
                  Engine/chassis number still pending
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Unit {pendingReminderUnits.map((item) => item.unitNo).join(", ")} still need manual update.
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Page checks alerts every {REMINDER_CHECK_MINUTES} minutes, and reminder tracking becomes due every {REMINDER_DUE_HOURS} hours until both numbers are added.
                </p>
              </div>
            </div>
          </div>
        )}

        {overdueDeliveryAlerts.length > 0 && (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CircleAlert size={18} className="mt-0.5 text-rose-600" />
              <div className="w-full">
                <p className="font-semibold text-rose-900">
                  Delivery overdue
                </p>
                <div className="mt-2 space-y-2">
                  {overdueDeliveryAlerts.map(({ unitNo, diffDays, booking }) => (
                    <div key={unitNo} className="flex items-center justify-between rounded-xl border border-rose-200 bg-white px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-rose-800">
                        <Calendar size={14} className="text-rose-500" />
                        <span>Unit {unitNo}</span>
                        <span className="text-xs text-rose-600">
                          ({new Date(booking!.deliveryDate!).toLocaleDateString()})
                        </span>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        {diffDays} day{diffDays > 1 ? "s" : ""} overdue
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {upcomingDeliveryReminders.length > 0 && (
          <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="mt-0.5 text-blue-600" />
              <div className="w-full">
                <p className="font-semibold text-blue-900">
                  Upcoming delivery reminders
                </p>
                <div className="mt-2 space-y-2">
                  {upcomingDeliveryReminders.map(({ unitNo, diffDays, booking }) => (
                    <div key={unitNo} className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Calendar size={14} className="text-blue-500" />
                        <span>Unit {unitNo}</span>
                        <span className="text-xs text-blue-600">
                          ({new Date(booking!.deliveryDate!).toLocaleDateString()})
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        {diffDays === 0 ? "Today" : `${diffDays} day${diffDays > 1 ? "s" : ""} left`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vehicle List</h2>
              <p className="text-sm text-slate-500">
                Clean unit-wise flow for quotation, approval, payment and delivery.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {units.length} units
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full table-fixed border-collapse bg-white text-center">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[24%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[30%]" />
                </colgroup>
                <thead className="bg-slate-50/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-6 py-4 align-middle">Vehicle ID</th>
                    <th className="border-b border-slate-200 px-6 py-4 align-middle">Vehicle</th>
                    <th className="border-b border-slate-200 px-6 py-4 align-middle">Color</th>
                    <th className="border-b border-slate-200 px-6 py-4 align-middle">Status</th>
                    <th className="border-b border-slate-200 px-6 py-4 align-middle">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                {units.map(({ booking, vehicleIndex, unitNo, name, variant, color }) => {
                    if (!booking) return null;

                    const statusMeta = STATUS_META[booking.status];
                    const vehicleId = `VEH-${String(unitNo).padStart(3, "0")}`;

                    return (
                      <tr
                        key={booking._id}
                        className="align-middle transition-colors duration-200 hover:bg-blue-50/30"
                      >
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                            {vehicleId}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          <p className="truncate font-semibold text-slate-900">{name}</p>
                          <p className="truncate text-sm text-slate-500">{variant}</p>
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
                                <Calendar size={10} />
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
                          ? getAssignedClientLabel(booking)
                          : "Allot Client"}
                      </button>
                            </div>
                            <button
                              onClick={() =>
                                navigate(`/vehicles/orders/${id}/unit-view/${vehicleIndex}`)
                              }
                              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:scale-110 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm active:scale-95"
                              title="View Vehicle"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/vehicles/orders/${id}/unit-edit/${vehicleIndex}`)
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <QuotationModal
        isOpen={quotationModalOpen}
        onClose={closeQuotationModal}
        booking={activeBooking}
        onSync={syncBooking}
      />

      {false &&
        ((activeBooking: VehicleBookingItem) => (
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
        ))(activeBooking as VehicleBookingItem)}

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
                              return client?.companyName || client?.name || "Choose client...";
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
                            const clientLabel =
                              client.companyName || client.name || "Client";
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

              {(activeBooking.assignedClientSnapshot?.companyName ||
                activeBooking.assignedClientSnapshot?.name) && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  Current allotment: {getAssignedClientLabel(activeBooking)}
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
    </>
  );
};

export default VehicleOrderDetails;
