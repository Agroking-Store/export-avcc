import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  CarFront,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  FilePenLine,
  FileText,
  Filter,
  PackageCheck,
  Plus,
  Search,
  Truck,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "../../../services/api";
import { IClient } from "../../clients/clients.types";
import {
  VehicleBookingItem,
  VehicleBookingStatus,
  vehicleBookingApi,
} from "../../../services/vehicleBookingApi";
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
    label: "Action Required ",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  quotation_details_pending: {
    label: "Awaiting Approval",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  quotation_uploaded: {
    label: "Awaiting Approval",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Awaiting Booking",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
  },
  payment_done: {
    label: "Awaiting Engine / Chassis Number",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  chassis_received: {
    label: "Awaiting Engine Number",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
};

const clientStatusOptions = [
  "All",
  "ORDERS PLACED",
  "BOOKED",
  "PENDING LC",
  "LC RECEIVED",
  "CARS IN TRANSIT",
  "CARS DELIVERED",
];


const adminStatusOptions = [
  "All",
  "Action Required",
  "Awaiting Approval",
  "Awaiting Engine / Chassis Number",
  "Make PI",
  "Delivered",
];

const statusLabelToRaw: Record<string, string> = {
  All: "All",
  "Action Required": "pending",
  "Awaiting Approval": "approvalPending",
  "Awaiting Engine / Chassis Number": "awaitingNumbers",
  "Make PI": "piPending",
  Delivered: "delivered",
  "ORDERS PLACED": "orders_placed",
  BOOKED: "booked",
  "PENDING LC": "pending_lc",
  "LC RECEIVED": "lc_received",
  "CARS IN TRANSIT": "in_transit",
  "CARS DELIVERED": "delivered_client",
};


interface ClientOrdersResponse {
  vehicleOrders?: VehicleBookingItem[];
  lcStats?: {
    totalPIs: number;
    lcReceived: number;
    lcPending: number;
  };
}

type ConfirmationAction = "deliver";

const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam, isClient, isAdmin, isDealer } = useAuth();
  const canManageBookings = isAdmin || isDealer || isClient;

  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [bookingStats, setBookingStats] = useState({
    deliveredTotal: 0,
    piReadyTotal: 0,
    totalAll: 0,
    pendingTotal: 0,
    approvalTotal: 0,
    awaitingNumbersTotal: 0,
    inProgressTotal: 0,
    lcPendingTotal: 0,
    sourcingTotal: 0,
    awaitingVinTotal: 0,
    // ─── CLIENT STATUS: Card stats ───
    ordersPlaced: 0,
    booked: 0,
    carsPendingLc: 0,
    carsInTransit: 0,
    carsDelivered: 0,
  });

  const rawToStatusLabel: Record<string, string> = {
    pending: "Action Required",
    approvalPending: "Awaiting Approval",
    quotation_details_pending: "Awaiting Approval",
    quotation_uploaded: "Awaiting Approval",
    awaitingNumbers: "Awaiting Engine / Chassis Number",
    payment_done: "Awaiting Engine / Chassis Number",
    chassis_received: "All",
    shipped: "All",
    delivered: "Delivered",
    piPending: "Make PI",
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
  const [confirmation, setConfirmation] = useState<{
    action: ConfirmationAction;
    booking: VehicleBookingItem;
  } | null>(null);

  const statusValue = statusLabelToRaw[statusLabel] || "All";


  // ─────────────────────────────────────────────────────────────
  // Client status bucket mapping (used for BOTH cards & table)
  // ─────────────────────────────────────────────────────────────
  const getClientBucket = (b: VehicleBookingItem) => {
    const pis = Array.isArray((b as any).associatedPIs)
      ? ((b as any).associatedPIs as Array<{ status?: string }>)
      : [];

    const hasPI = pis.length > 0;
    const hasLcReceived = pis.some((pi) => pi?.status === "lc_received");

    const isDelivered = b.status === "delivered";
    const isInTransit = b.status === "shipped";
    const isBooked = !!b.assignedDealerId && !hasPI && !isDelivered;

    // orders placed = booked + pending LC + LC received + in transit + delivered
    if (isBooked) return "BOOKED";

    // pending LC = PI exists but LC not received
    if (hasPI && !hasLcReceived && !isDelivered && !isInTransit) {
      return "PENDING LC";
    }

    // LC RECEIVED = LC uploaded/received for this vehicle (via PI),
    // but it is not shipped yet.
    // (Even if chassis number exists, this bucket is still valid.)
    if (hasPI && hasLcReceived && !isDelivered && !isInTransit) {
      return "LC RECEIVED";
    }


    if (isInTransit) return "CARS IN TRANSIT";
    if (isDelivered) return "CARS DELIVERED";

    return "OTHER";
  };


  const fetchBookings = async () => {
    try {
      setLoading(true);

      if (isClient) {
        const response = await api.get<ClientOrdersResponse>("/clients/me");
        const clientBookings = Array.isArray(response.data?.vehicleOrders)
          ? response.data.vehicleOrders
          : [];

        const hasChassis = (b: VehicleBookingItem) =>
          !!String(b.chassisNumber || "").trim();

        const isPendingLC = (b: VehicleBookingItem) => {
          const pis = (b as any).associatedPIs;
          if (!Array.isArray(pis) || pis.length === 0) return false;
          return !pis.some((pi: any) => pi.status === "lc_received");
        };

        const ordersPlaced = clientBookings.length;
        const booked = clientBookings.filter(
          (b) =>
            !!b.assignedDealerId && !hasChassis(b) && b.status !== "delivered",
        ).length;
        const carsPendingLc = clientBookings.filter(isPendingLC).length;
        const carsInTransit = clientBookings.filter(
          (b) => b.status === "shipped",
        ).length;
        const carsDelivered = clientBookings.filter(
          (b) => b.status === "delivered",
        ).length;

        const normalizedSearch = search.trim().toLowerCase();
        const filteredBookings = clientBookings.filter((booking) => {
          let statusMatches = false;
          if (statusValue === "All" || statusValue === "orders_placed") {
            statusMatches = true;
          } else if (statusValue === "booked") {
            statusMatches =
              !!booking.assignedDealerId &&
              !hasChassis(booking) &&
              booking.status !== "delivered";
          } else if (statusValue === "pending_lc") {
            statusMatches = isPendingLC(booking);
          } else if (statusValue === "lc_received") {
            const pis = (booking as any).associatedPIs;
            const hasPI = Array.isArray(pis) && pis.length > 0;
            const hasLcReceived =
              hasPI && pis.some((pi: any) => pi?.status === "lc_received");
            statusMatches = hasLcReceived;
          } else if (statusValue === "in_transit") {
            statusMatches = booking.status === "shipped";

          } else if (statusValue === "delivered_client") {
            statusMatches = booking.status === "delivered";
          } else {
            statusMatches = booking.status === statusValue;
          }

          if (!statusMatches) return false;

          const orderData = (booking as any).orderId;
          const vehicleSnapshot =
            typeof orderData === "object" && orderData !== null
              ? orderData.vehicleSnapshot
              : null;

          if (!normalizedSearch) return true;

          const searchValue = [
            orderData?.orderNumber,
            vehicleSnapshot?.brandName,
            vehicleSnapshot?.modelName,
            vehicleSnapshot?.variant,
            vehicleSnapshot?.color,
            booking.engineNumber,
            booking.chassisNumber,
            booking.assignedDealerSnapshot?.name,
            booking.assignedClientSnapshot?.name,
            booking.assignedClientSnapshot?.companyName,
            getDisplayStatusMeta(booking)?.label,
            booking.status,
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
        setBookingStats({
          deliveredTotal: clientBookings.filter((b) => b.status === "delivered")
            .length,
          piReadyTotal: clientBookings.filter(
            (b) => b.engineNumber && b.chassisNumber && !b.piGenerated,
          ).length,
          totalAll: clientBookings.length,
          pendingTotal: clientBookings.filter((b) => b.status === "pending")
            .length,
          approvalTotal: clientBookings.filter((b) =>
            ["quotation_details_pending", "quotation_uploaded"].includes(
              b.status,
            ),
          ).length,
          awaitingNumbersTotal: clientBookings.filter(
            (b) => b.status === "payment_done",
          ).length,
          inProgressTotal: clientBookings.filter(
            (b) => b.status !== "delivered",
          ).length,
          lcPendingTotal: carsPendingLc,
          sourcingTotal: clientBookings.filter((b) =>
            [
              "pending",
              "quotation_details_pending",
              "quotation_uploaded",
              "approved",
              "payment_done",
            ].includes(b.status),
          ).length,
          awaitingVinTotal: clientBookings.filter(
            (b) => !b.chassisNumber && b.status !== "delivered",
          ).length,
          ordersPlaced,
          booked,
          carsPendingLc,
          carsInTransit,
          carsDelivered,
        });
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
      const stats = res.stats;
      setBookingStats({
        deliveredTotal: stats?.deliveredTotal || 0,
        piReadyTotal: stats?.piReadyTotal || 0,
        totalAll: stats?.totalAll || 0,
        pendingTotal: stats?.pendingTotal || 0,
        approvalTotal: stats?.approvalTotal || 0,
        awaitingNumbersTotal: stats?.awaitingNumbersTotal || 0,
        inProgressTotal: stats?.inProgressTotal || 0,
        lcPendingTotal: stats?.lcPendingTotal || 0,
        sourcingTotal: stats?.sourcingTotal || 0,
        awaitingVinTotal: stats?.awaitingVinTotal || 0,
        ordersPlaced: 0,
        booked: 0,
        carsPendingLc: 0,
        carsInTransit: 0,
        carsDelivered: 0,
      });
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

  const openDeliveredConfirmation = (booking: VehicleBookingItem) => {
    if (booking.status !== "shipped") {
      toast.error("Not shipped yet");
      return;
    }
    if (!hasGeneratedPI(booking)) {
      toast.error("PI not created");
      return;
    }
    if (!booking.assignedClientId) {
      toast.error(
        "Please allot a client before marking this vehicle as delivered.",
      );
      return;
    }
    setConfirmation({ action: "deliver", booking });
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    const { booking } = confirmation;
    setConfirmation(null);
    await handleMarkDelivered(booking);
  };

  const handleMarkDelivered = async (booking: VehicleBookingItem) => {
    if (booking.status !== "shipped") {
      toast.error("Not shipped yet");
      return;
    }
    if (!hasGeneratedPI(booking)) {
      toast.error("PI not created");
      return;
    }
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

  const hasGeneratedPI = (booking: VehicleBookingItem) =>
    booking.piGenerated ||
    (Array.isArray(booking.associatedPIs) && booking.associatedPIs.length > 0);

  const isPostBookingFlow = (booking: VehicleBookingItem) =>
    ["payment_done", "chassis_received", "shipped"].includes(booking.status);

  const hasReadyToShipInvoices = (booking: VehicleBookingItem) =>
    !!booking.invoiceReadiness?.INR &&
    !!booking.invoiceReadiness?.USD &&
    !!booking.invoiceReadiness?.COMMERCIAL;

  const getDisplayStatusMeta = (booking: VehicleBookingItem) => {
    // ─── CLIENT STATUS: Show abstracted labels for client ───
    if (isClient) {
      if (booking.status === "delivered") {
        return {
          label: "Delivered",
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      }
      if (booking.status === "shipped") {
        return {
          label: "In Transit",
          badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
        };
      }
      if (
        !!booking.assignedDealerId &&
        !String(booking.chassisNumber || "").trim() &&
        booking.status !== ("delivered" as VehicleBookingStatus)
      ) {
        return {
          label: "Booked",
          badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
        };
      }
      // Default fallback to original status
      return STATUS_META[booking.status];
    }

    const hasEngine = !!String(booking.engineNumber || "").trim();
    const hasChassis = !!String(booking.chassisNumber || "").trim();
    const hasPI = hasGeneratedPI(booking);

    if (isPostBookingFlow(booking) && !hasPI) {
      return {
        label: "Make PI",
        badge: "bg-purple-100 text-purple-700 border-purple-200",
      };
    }

    if (booking.status === "payment_done" && hasPI) {
      if (hasChassis && !hasEngine) {
        return {
          label: "Awaiting Engine",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
      }
      if (hasEngine && !hasChassis) {
        return {
          label: "Awaiting Chassis",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
      }
    }

    if (booking.status === "chassis_received" && hasPI) {
      return {
        label: "PI Created",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }
    return STATUS_META[booking.status];
  };

  const canDeleteBooking = (booking: VehicleBookingItem) =>
    isAdmin &&
    !booking.quotationFile &&
    ["pending", "rejected"].includes(booking.status);

  const handleDeleteBooking = async (booking: VehicleBookingItem) => {
    if (
      !window.confirm(
        "Delete this vehicle entry? This is allowed only before quotation upload/approval.",
      )
    ) {
      return;
    }
    try {
      await vehicleBookingApi.delete(booking._id);
      toast.success("Vehicle entry deleted");
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete entry");
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

  const formatEstimatedCollectionDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderPrimaryAction = (booking: VehicleBookingItem) => {
    const orderId = getOrderId(booking);
    const primaryActionClass =
      "cursor-pointer inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition whitespace-nowrap";

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
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition whitespace-nowrap ${isSourcingTeam ? "bg-slate-400 text-white cursor-not-allowed opacity-60" : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"}`}
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
      case "chassis_received": {
        return (
          <button
            onClick={() => openDeliveredConfirmation(booking)}
            className={`${primaryActionClass} bg-[#1e40af] hover:bg-[#1d4ed8]`}
          >
            <Truck size={14} />
            Mark Delivered
          </button>
        );
      }
      case "shipped":
        return (
          <button
            onClick={() => openDeliveredConfirmation(booking)}
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
          label: "ORDERS PLACED",
          filterLabel: "ORDERS PLACED",
          value: bookingStats.ordersPlaced,
          detail: "Required vehicles placed by you or our team",
          icon: <CarFront size={20} />,
          tone: "bg-blue-50 text-blue-700 border-blue-100",
        },
        {
          label: "BOOKED",
          filterLabel: "BOOKED",
          value: bookingStats.booked,
          detail: "Booked vehicles",
          icon: <Store size={20} />,
          tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
        },
        {
          label: "PENDING LC",
          filterLabel: "PENDING LC",
          value: bookingStats.carsPendingLc,
          detail: "PI created but LC not received",
          icon: <FileText size={20} />,
          tone: "bg-amber-50 text-amber-700 border-amber-100",
        },
        {
          label: "CARS IN TRANSIT",
          filterLabel: "CARS IN TRANSIT",
          value: bookingStats.carsInTransit,
          detail: "Shipped and on the way to Sri Lanka",
          icon: <Truck size={20} />,
          tone: "bg-cyan-50 text-cyan-700 border-cyan-100",
        },
        {
          label: "CARS DELIVERED",
          filterLabel: "CARS DELIVERED",
          value: bookingStats.carsDelivered,
          detail: "Delivered vehicles",
          icon: <PackageCheck size={20} />,
          tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
        },
      ];
    }

    // ORIGINAL ADMIN CARDS
    return [
      {
        label: "Action Required",
        filterLabel: "Action Required",
        value: bookingStats.pendingTotal,
        tone: "bg-slate-100 text-slate-800",
      },
      {
        label: "Awaiting Approval",
        filterLabel: "Awaiting Approval",
        value: bookingStats.approvalTotal,
        tone: "bg-amber-100 text-amber-800",
      },
      {
        label: "Awaiting Numbers",
        filterLabel: "Awaiting Engine / Chassis Number",
        value: bookingStats.awaitingNumbersTotal,
        tone: "bg-blue-100 text-blue-800",
      },
      {
        label: "Make PI",
        filterLabel: "Make PI",
        value: bookingStats.piReadyTotal,
        tone: "bg-purple-100 text-purple-800",
      },
      {
        label: "Delivered",
        filterLabel: "Delivered",
        value: bookingStats.deliveredTotal,
        tone: "bg-emerald-100 text-emerald-800",
      },
    ];
  }, [bookingStats, isClient]);

  const pageTitle = isClient ? "My Vehicle List" : "Vehicles List";
  const pageDescription = isClient
    ? "View the vehicle orders assigned to your account"
    : "Track and manage vehicle list unit-wise";
  const getAssignedClientLabel = (booking: VehicleBookingItem) =>
    booking.assignedClientSnapshot?.companyName ||
    booking.assignedClientSnapshot?.name ||
    "Allot Client";
  const confirmationMissingInvoices =
    confirmation?.action === "deliver" &&
    !hasReadyToShipInvoices(confirmation.booking);

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
            <Select value={statusLabel} onValueChange={setStatusLabel}>
              <SelectTrigger className="h-11 min-w-[240px] rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-slate-200">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Filter size={15} />
                  </span>
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>

              <SelectContent
                align="start"
                position="popper"
                className="min-w-[240px] rounded-xl p-1"
              >
                {/* ─── CLIENT STATUS: Use client-specific dropdown options ─── */}
                {(isClient ? clientStatusOptions : adminStatusOptions).map(
                  (item) => (
                    <SelectItem key={item} value={item} className="py-2">
                      {item === "All" ? "All Statuses" : item}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder={
                isClient
                  ? "Search ID, vehicle, color, status..."
                  : "Search ID, vehicle, color, dealer, client..."
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
            {summaryCards.map((card: any) => (
              <button
                key={card.label}
                type="button"
                onClick={() => setStatusLabel(card.filterLabel)}
                className={`cursor-pointer rounded-[24px] border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  statusLabel === card.filterLabel
                    ? "border-blue-300 bg-blue-50/70 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* ─── CLIENT STATUS: Show icon ─── */}
                {card.icon && (
                  <div
                    className={`rounded-xl p-2.5 mb-3 inline-flex ${card.tone}`}
                  >
                    {card.icon}
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                {/* ─── CLIENT STATUS: Show detail text ─── */}
                {card.detail && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {card.detail}
                  </p>
                )}
                <div
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${card.tone}`}
                >
                  {card.value} vehicles
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full table-fixed border-collapse bg-white text-center">
              <thead className="bg-slate-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-[9%] border-b border-slate-200 px-5 py-4 align-middle">
                    Vehicle ID
                  </th>
                  <th
                    className={`${isClient ? "w-[18%]" : "w-[20%]"} border-b border-slate-200 px-5 py-4 align-middle text-left`}
                  >
                    Vehicle
                  </th>
                  <th className="w-[10%] border-b border-slate-200 px-4 py-4 align-middle">
                    Color
                  </th>
                  <th className="w-[8%] border-b border-slate-200 px-4 py-4 align-middle">
                    Chassis
                  </th>
                  <th className="w-[15%] border-b border-slate-200 px-4 py-4 align-middle">
                    Status
                  </th>
                  {isClient && (
                    <th className="w-[16%] border-b border-slate-200 px-4 py-4 align-middle">
                      Estimated Collection Date
                    </th>
                  )}
                  <th
                    className={`${isClient ? "w-[24%]" : "w-[38%]"} border-b border-slate-200 px-5 py-4 align-middle text-center`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={isClient ? 7 : 6}
                      className="text-center py-20 text-slate-400 italic"
                    >
                      Loading vehicles...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isClient ? 7 : 6}
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
                    const statusMeta = getDisplayStatusMeta(booking);
                    const vehicleSerial =
                      total - ((currentPage - 1) * limit + idx);
                    const vehicleId = `VEH${String(vehicleSerial).padStart(3, "0")}`;
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

                        <td className="border-b border-slate-100 px-4 py-5 align-middle">
                          <span className="font-mono text-sm font-semibold text-slate-700 tracking-wider">
                            {booking.chassisNumber
                              ? booking.chassisNumber.slice(-4)
                              : "-"}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-5 py-5 align-middle">
                          <span
                            className={`inline-flex max-w-[170px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold leading-4 ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        {isClient && (
                          <td className="border-b border-slate-100 px-4 py-5 align-middle">
                            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {formatEstimatedCollectionDate(
                                booking.deliveryDate,
                              )}
                            </span>
                          </td>
                        )}

                        <td className="border-b border-slate-100 px-6 py-5 align-middle">
                          {isClient ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                                )
                              }
                              className="cursor-pointer inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Eye size={14} /> View Details
                            </button>
                          ) : (
                            <div className="ml-auto w-full max-w-[560px] space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => openDealerModal(booking)}
                                  className={`cursor-pointer inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${booking.assignedDealerId ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                                  title={
                                    booking.assignedDealerId
                                      ? booking.assignedDealerSnapshot?.name
                                      : "Allot Dealer"
                                  }
                                >
                                  <Store size={14} />
                                  <span className="truncate">
                                    {booking.assignedDealerId
                                      ? booking.assignedDealerSnapshot?.name
                                      : "Allot Dealer"}
                                  </span>
                                </button>
                                <button
                                  onClick={() =>
                                    !isSourcingTeam && openClientModal(booking)
                                  }
                                  className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs cursor-pointer font-semibold transition ${booking.assignedClientId ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                                  title={
                                    booking.assignedClientId
                                      ? getAssignedClientLabel(booking)
                                      : "Allot Client"
                                  }
                                >
                                  <Check size={14} />
                                  <span className="truncate">
                                    {booking.assignedClientId
                                      ? getAssignedClientLabel(booking)
                                      : "Allot Client"}
                                  </span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1">
                                  {renderPrimaryAction(booking)}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                                      )
                                    }
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-blue-50 cursor-pointer"
                                    title="View details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`,
                                      )
                                    }
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition-all hover:bg-blue-50 cursor-pointer"
                                    title="Edit vehicle"
                                  >
                                    <FilePenLine size={16} />
                                  </button>
                                  {canDeleteBooking(booking) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteBooking(booking)
                                      }
                                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 cursor-pointer"
                                      title="Delete entry"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
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
      <AlertDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-blue-50 text-blue-700">
              <Truck size={22} />
            </AlertDialogMedia>
            <AlertDialogTitle>Mark as delivered?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationMissingInvoices
                ? "⚠️ Invoices not generated for this vehicle. Are you sure you want to mark as delivered?"
                : "This will mark the vehicle as delivered for the assigned client."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleOrdersList;
