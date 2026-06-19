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
  AlertCircle,
  Clock,
  CheckCircle,
  Hash,
  FileCheck,
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

// ═══════════════════════════════════════════════════════════════════
// DROPDOWN OPTIONS
// ═══════════════════════════════════════════════════════════════════
const ADMIN_STATUS_OPTIONS = [
  "All",
  "Action Required",
  "Awaiting Approval",
  "Awaiting Booking",
  "Awaiting Numbers",
  "Make PI",
  "Shipped",
  "Delivered",
  "Cancelled Vehicles",
];

const CLIENT_STATUS_OPTIONS = [
  "All",
  "ORDERS PLACED",
  "AWAITING VIN",
  "PENDING LC",
  "LC RECEIVED",
  "CARS IN TRANSIT",
  "CARS DELIVERED",
  "CANCELLED VEHICLES",
];

// ═══════════════════════════════════════════════════════════════════
// FILTER MAPPINGS: dropdown label → API / bucket value
// ═══════════════════════════════════════════════════════════════════
const adminFilterMap: Record<string, string> = {
  All: "All",
  "Action Required": "pending",
  "Awaiting Approval": "approvalPending",
  "Awaiting Booking": "approved",
  "Awaiting Numbers": "awaitingNumbers",
  "Make PI": "makePI",
  Shipped: "shipped",
  Delivered: "delivered",
  "Cancelled Vehicles": "cancelled",
};

const clientFilterMap: Record<string, string> = {
  All: "All",
  "ORDERS PLACED": "orders_placed",
  "AWAITING VIN": "AWAITING VIN",
  "PENDING LC": "PENDING LC",
  "LC RECEIVED": "LC RECEIVED",
  "CARS IN TRANSIT": "CARS IN TRANSIT",
  "CARS DELIVERED": "CARS DELIVERED",
  "CANCELLED VEHICLES": "cancelled",
};

// ═══════════════════════════════════════════════════════════════════
// INCOMING NAVIGATION FILTER: raw status → dropdown label
// ═══════════════════════════════════════════════════════════════════
const rawToAdminLabel: Record<string, string> = {
  pending: "Action Required",
  quotation_details_pending: "Awaiting Approval",
  quotation_uploaded: "Awaiting Approval",
  approved: "Awaiting Booking",
  payment_done: "Awaiting Numbers",
  chassis_received: "Awaiting Numbers",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled Vehicles",
};

const rawToClientLabel: Record<string, string> = {
  pending: "All",
  quotation_details_pending: "All",
  quotation_uploaded: "All",
  approved: "All",
  payment_done: "AWAITING VIN",
  chassis_received: "AWAITING VIN",
  shipped: "CARS IN TRANSIT",
  delivered: "CARS DELIVERED",
  cancelled: "CANCELLED VEHICLES",
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const hasGeneratedPI = (b: VehicleBookingItem): boolean =>
  b.piGenerated ||
  (Array.isArray((b as any).associatedPIs) &&
    (b as any).associatedPIs.length > 0);

const hasChassis = (b: VehicleBookingItem): boolean =>
  !!String(b.chassisNumber || "").trim();

const isChassisSuffixSearch = (value: string) =>
  /^[a-zA-Z0-9]{4}$/.test(value.trim());

const bookingMatchesSearch = (
  booking: VehicleBookingItem,
  normalizedSearch: string,
): boolean => {
  if (!normalizedSearch) return true;

  if (isChassisSuffixSearch(normalizedSearch)) {
    const chassis = String(booking.chassisNumber || "")
      .trim()
      .toLowerCase();
    return chassis.endsWith(normalizedSearch);
  }

  const orderData = (booking as any).orderId;
  const vehicleSnapshot =
    typeof orderData === "object" && orderData !== null
      ? orderData.vehicleSnapshot
      : null;

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
    getClientDisplayStatus(booking)?.label,
    booking.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchValue.includes(normalizedSearch);
};

const hasEngine = (b: VehicleBookingItem): boolean =>
  !!String(b.engineNumber || "").trim();

const hasLcReceived = (b: VehicleBookingItem): boolean => {
  const pis = Array.isArray((b as any).associatedPIs)
    ? (b as any).associatedPIs
    : [];
  return pis.length > 0 && pis.some((pi: any) => pi?.status === "lc_received");
};

const hasAnyPI = (b: VehicleBookingItem): boolean => {
  const pis = Array.isArray((b as any).associatedPIs)
    ? (b as any).associatedPIs
    : [];
  return pis.length > 0;
};

// ═══════════════════════════════════════════════════════════════════
// CLIENT BUCKET
// ═══════════════════════════════════════════════════════════════════
//

// const getClientBucket = (b: VehicleBookingItem): string => {
//   if (b.status === "delivered") return "CARS DELIVERED";
//   if (b.status === "shipped") return "CARS IN TRANSIT";
//   if (hasLcReceived(b) && b.status !== "shipped") return "LC RECEIVED";
//   if (hasAnyPI(b) && !hasLcReceived(b)) return "PENDING LC";
//   if (
//     ["approved", "payment_done", "chassis_received"].includes(b.status) &&
//     !hasGeneratedPI(b)
//   )
//     return "BOOKED";
//   return "OTHER";
// };

const getClientCards = (b: VehicleBookingItem): string[] => {
  if (b.status === "cancelled") {
    return ["CANCELLED VEHICLES"];
  }
  const cards: string[] = ["ORDERS PLACED"];

  if (b.status === "delivered") {
    cards.push("CARS DELIVERED");
    return cards;
  }

  if (b.status === "shipped") {
    cards.push("CARS IN TRANSIT");
    if (!hasLcReceived(b)) {
      cards.push("PENDING LC");
    }
    return cards;
  }

  if (hasLcReceived(b)) {
    cards.push("LC RECEIVED");
    return cards;
  }

  if (hasGeneratedPI(b)) {
    cards.push("PENDING LC");
    return cards;
  }

  if (
    ["payment_done", "chassis_received"].includes(b.status) &&
    !hasGeneratedPI(b)
  ) {
    cards.push("AWAITING VIN");
    return cards;
  }

  // pending, quotation_details_pending, quotation_uploaded, rejected
  // → only in ORDERS PLACED
  return cards;
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN CARD MEMBERSHIP
// ═══════════════════════════════════════════════════════════════════
//
// A vehicle can belong to MULTIPLE cards simultaneously.
//
// Action Required   = raw status === pending
// Awaiting Approval = raw status in [quotation_details_pending, quotation_uploaded]
// Awaiting Booking  = raw status === approved
// Awaiting Numbers  = raw status in [payment_done, chassis_received, shipped]
//                     AND (missing chassis OR missing engine)
// Make PI           = raw status in [payment_done, chassis_received]
//                     AND has chassis AND no PI generated
// Shipped           = raw status === shipped
// Delivered         = raw status === delivered
// Cancelled Vehicles = raw status === cancelled
//
// Overlap examples:
//   chassis received, no engine, no PI → ["Awaiting Numbers", "Make PI"]
//   chassis received, no engine, PI made → ["Awaiting Numbers"]
//   both received, no PI → ["Make PI"] (NOT "Awaiting Numbers")
//   shipped, no engine → ["Awaiting Numbers", "Shipped"]
//
const getAdminCards = (b: VehicleBookingItem): string[] => {
  if (b.status === "cancelled") {
    return ["Cancelled Vehicles"];
  }
  const cards: string[] = [];

  if (b.status === "pending") cards.push("Action Required");

  if (["quotation_details_pending", "quotation_uploaded"].includes(b.status))
    cards.push("Awaiting Approval");

  if (b.status === "approved") cards.push("Awaiting Booking");

  const isPostBookingOrShipped = [
    "payment_done",
    "chassis_received",
    "shipped",
  ].includes(b.status);

  if (isPostBookingOrShipped && (!hasChassis(b) || !hasEngine(b))) {
    cards.push("Awaiting Numbers");
  }

  const isPostBooking = ["payment_done", "chassis_received"].includes(b.status);
  if (isPostBooking && hasChassis(b) && !hasGeneratedPI(b)) {
    cards.push("Make PI");
  }

  if (b.status === "shipped") cards.push("Shipped");

  if (b.status === "delivered") cards.push("Delivered");

  return cards;
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN DISPLAY STATUS (badge in table row — NOT the card)
// ═══════════════════════════════════════════════════════════════════
//
// pending                  → "Action Required"
// quotation_*              → "Awaiting Approval"
// approved                 → "Awaiting Booking"
// rejected                 → "Rejected"
//
// payment_done / chassis_received:
//   has PI                → "PI Created"
//   has chassis + engine  → "Make PI"              (case 2: both at once)
//   has chassis, no engine→ "Awaiting Engine Number"
//   no chassis, has engine→ "Awaiting Chassis Number"
//   no chassis, no engine → "Awaiting Chassis/Engine Number"
//
// shipped                  → "Shipped"
// delivered                → "Delivered"
//
const getAdminDisplayStatus = (
  b: VehicleBookingItem,
): { label: string; badge: string } => {
  switch (b.status) {
    case "pending":
      return {
        label: "Action Required",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };

    case "quotation_details_pending":
    case "quotation_uploaded":
      return {
        label: "Awaiting Approval",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
      };

    case "approved":
      return {
        label: "Awaiting Booking",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };

    case "rejected":
      return {
        label: "Rejected",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
      };

    case "payment_done":
    case "chassis_received": {
      const c = hasChassis(b);
      const e = hasEngine(b);
      const pi = hasGeneratedPI(b);

      // Both numbers present → check PI
      if (c && e) {
        if (pi) {
          return {
            label: "PI Created",
            badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
          };
        }
        return {
          label: "Make PI",
          badge: "bg-purple-100 text-purple-700 border-purple-200",
        };
      }

      // Chassis present, engine missing → ALWAYS "Awaiting Engine Number"
      // regardless of PI status (engine is optional but if missing, show it)
      if (c && !e) {
        return {
          label: "Awaiting Engine Number",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
      }

      // Engine present, chassis missing
      if (!c && e) {
        return {
          label: "Awaiting Chassis Number",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
      }

      // Neither present
      return {
        label: "Awaiting Chassis/Engine Number",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
      };
    }

    case "shipped":
      return {
        label: "Shipped",
        badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
      };

    case "delivered":
      return {
        label: "Delivered",
        badge: "bg-green-100 text-green-700 border-green-200",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        badge: "bg-rose-100 text-rose-700 border-rose-200",
      };

    default:
      return {
        label: b.status,
        badge: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
};

// ═══════════════════════════════════════════════════════════════════
// CLIENT DISPLAY STATUS
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// CLIENT DISPLAY STATUS (badge in table row)
// ═══════════════════════════════════════════════════════════════════
const getClientDisplayStatus = (
  b: VehicleBookingItem,
): { label: string; badge: string } => {
  if (b.status === "cancelled") {
    return {
      label: "Cancelled",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }
  if (b.status === "delivered") {
    return {
      label: "Delivered",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }
  if (b.status === "shipped") {
    return {
      label: "In Transit",
      badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    };
  }
  if (hasLcReceived(b)) {
    return {
      label: "LC Received",
      badge: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (hasGeneratedPI(b)) {
    return {
      label: "Pending LC",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  if (["payment_done", "chassis_received"].includes(b.status)) {
    return {
      label: "Awaiting VIN",
      badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
  }
  return {
    label: "Processing",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  };
};

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════
interface ClientOrdersResponse {
  vehicleOrders?: VehicleBookingItem[];
  lcStats?: {
    totalPIs: number;
    lcReceived: number;
    lcPending: number;
  };
}

type ConfirmationAction = "deliver";

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════
const VehicleOrdersList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSourcingTeam, isClient, isAdmin, isDealer } = useAuth();
  const canManageBookings = isAdmin || isDealer || isClient;

  // ─── STATE ──────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [bookingStats, setBookingStats] = useState({
    // Admin stats
    pendingTotal: 0,
    approvalTotal: 0,
    approvedTotal: 0,
    awaitingNumbersTotal: 0,
    makePiTotal: 0,
    shippedTotal: 0,
    deliveredTotal: 0,
    cancelledTotal: 0,
    // Client stats
    ordersPlaced: 0,
    awaitingVin: 0,
    pendingLc: 0,
    lcReceived: 0,
    carsInTransit: 0,
    carsDelivered: 0,
    cancelledVehicles: 0,
  });

  const incomingFilter = (location.state as any)?.statusFilter;
  const [statusLabel, setStatusLabel] = useState<string>(
    incomingFilter
      ? isClient
        ? rawToClientLabel[incomingFilter] || "All"
        : rawToAdminLabel[incomingFilter] || "All"
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

  // ─── DERIVED FILTER VALUE ───────────────────────────────────────
  const filterValue = isClient
    ? clientFilterMap[statusLabel] || "All"
    : adminFilterMap[statusLabel] || "All";

  // ─── FETCH BOOKINGS ─────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // ─── CLIENT PATH ──────────────────────────────────────────
      if (isClient) {
        const response = await api.get<ClientOrdersResponse>("/clients/me");
        const clientBookings = Array.isArray(response.data?.vehicleOrders)
          ? response.data.vehicleOrders
          : [];

        // Compute card counts (multi-card: a vehicle can be in multiple cards)
        const cardCounts: Record<string, number> = {
          "ORDERS PLACED": 0,
          "AWAITING VIN": 0,
          "PENDING LC": 0,
          "LC RECEIVED": 0,
          "CARS IN TRANSIT": 0,
          "CARS DELIVERED": 0,
          "CANCELLED VEHICLES": 0,
        };
        clientBookings.forEach((b) => {
          const cards = getClientCards(b);
          cards.forEach((card) => {
            cardCounts[card] = (cardCounts[card] || 0) + 1;
          });
        });

        // Filter bookings based on selected status
        const normalizedSearch = search.trim().toLowerCase();
        const filteredBookings = clientBookings.filter((booking) => {
          // Status filter
          let statusMatches = false;
          if (filterValue === "All" || filterValue === "orders_placed") {
            statusMatches = true;
          } else {
            const cards = getClientCards(booking);
            statusMatches = cards.includes(filterValue);
          }
          if (!statusMatches) return false;

          if (!bookingMatchesSearch(booking, normalizedSearch)) return false;

          return true;
        });

        const nextTotal = filteredBookings.length;
        const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
        const startIndex = (currentPage - 1) * limit;

        setBookings(filteredBookings.slice(startIndex, startIndex + limit));
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
        setBookingStats({
          pendingTotal: 0,
          approvalTotal: 0,
          approvedTotal: 0,
          awaitingNumbersTotal: 0,
          makePiTotal: 0,
          shippedTotal: 0,
          deliveredTotal: 0,
          cancelledTotal: 0,
          ordersPlaced: cardCounts["ORDERS PLACED"],
          awaitingVin: cardCounts["AWAITING VIN"],
          pendingLc: cardCounts["PENDING LC"],
          lcReceived: cardCounts["LC RECEIVED"],
          carsInTransit: cardCounts["CARS IN TRANSIT"],
          carsDelivered: cardCounts["CARS DELIVERED"],
          cancelledVehicles: cardCounts["CANCELLED VEHICLES"],
        });
        return;
      }

      // ─── ADMIN PATH ───────────────────────────────────────────
      const res = await vehicleBookingApi.getAllBookings({
        search,
        status: filterValue === "All" ? undefined : filterValue,
        page: currentPage,
        limit,
      });

      setBookings(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);

      const stats = res.stats as any;
      setBookingStats({
        pendingTotal: stats?.pendingTotal || 0,
        approvalTotal: stats?.approvalTotal || 0,
        approvedTotal: stats?.approvedTotal || 0,
        awaitingNumbersTotal: stats?.awaitingNumbersTotal || 0,
        makePiTotal: stats?.makePiTotal || 0,
        shippedTotal: stats?.shippedTotal || 0,
        deliveredTotal: stats?.deliveredTotal || 0,
        cancelledTotal: stats?.cancelledTotal || 0,
        ordersPlaced: 0,
        awaitingVin: 0,
        pendingLc: 0,
        lcReceived: 0,
        carsInTransit: 0,
        carsDelivered: 0,
        cancelledVehicles: 0,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  // ─── EFFECTS ────────────────────────────────────────────────────
  useEffect(() => {
    fetchBookings();
  }, [currentPage, isClient, search, statusLabel]);

  useEffect(() => {
    const pendingCount = bookings.filter(
      (b) =>
        ["payment_done", "chassis_received"].includes(b.status) &&
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

  // ─── HANDLERS ───────────────────────────────────────────────────
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

  const hasReadyToShipInvoices = (booking: VehicleBookingItem) =>
    !!booking.invoiceReadiness?.INR &&
    !!booking.invoiceReadiness?.USD &&
    !!booking.invoiceReadiness?.COMMERCIAL;

  const openDeliveredConfirmation = (booking: VehicleBookingItem) => {
    if (booking.status !== "shipped") {
      toast.error("Vehicle must be shipped before marking as delivered");
      return;
    }
    if (!hasGeneratedPI(booking)) {
      toast.error("PI must be created before marking as delivered");
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
      toast.error("Vehicle must be shipped before marking as delivered");
      return;
    }
    if (!hasGeneratedPI(booking)) {
      toast.error("PI must be created before marking as delivered");
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

  // ─── TABLE HELPERS ──────────────────────────────────────────────
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
    const missingEngine = !hasEngine(booking);
    const missingChassis = !hasChassis(booking);
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

  const getAssignedClientLabel = (booking: VehicleBookingItem) =>
    booking.assignedClientSnapshot?.companyName ||
    booking.assignedClientSnapshot?.name ||
    "Allot Client";

  // ─── UNIFIED DISPLAY STATUS ─────────────────────────────────────
  const getDisplayStatusMeta = (booking: VehicleBookingItem) => {
    if (isClient) return getClientDisplayStatus(booking);
    return getAdminDisplayStatus(booking);
  };

  const handleShip = async (booking: VehicleBookingItem) => {
    if (!hasChassis(booking)) {
      toast.error("Chassis number is required for shipping");
      return;
    }
    if (!hasGeneratedPI(booking)) {
      toast.error("PI must be created before shipping");
      return;
    }
    try {
      const updated = await vehicleBookingApi.updateStatus(
        booking._id,
        "shipped",
      );
      syncBooking(updated);
      toast.success("Vehicle marked as shipped");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to ship vehicle");
    }
  };

  // ─── PRIMARY ACTION BUTTON (admin only) ─────────────────────────
  const renderPrimaryAction = (booking: VehicleBookingItem) => {
    const orderId = getOrderId(booking);
    const cls =
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
            className={`${cls} ${booking.assignedDealerId ? "bg-slate-900 hover:bg-slate-700" : "bg-slate-400 opacity-60 cursor-not-allowed"}`}
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
            className={`${cls} ${booking.assignedDealerId ? (booking.status === "quotation_details_pending" ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600") : "bg-slate-400 opacity-60 cursor-not-allowed"}`}
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

      case "payment_done": {
        const c = hasChassis(booking);
        const pi = hasGeneratedPI(booking);

        // Chassis + PI → can ship (engine optional)
        if (c && pi) {
          return (
            <button
              onClick={() => handleShip(booking)}
              className={`${cls} bg-cyan-600 hover:bg-cyan-700`}
            >
              <Truck size={14} />
              Ship Vehicle
            </button>
          );
        }

        // Chassis present, no PI → create PI
        if (c && !pi) {
          return (
            <button
              onClick={() =>
                // navigate(
                //   `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                // )
                navigate(`/proforma-invoice/list`)
              }
              className={`${cls} bg-purple-600 hover:bg-purple-700`}
            >
              <FileText size={14} />
              Create PI
            </button>
          );
        }

        // No chassis → enter numbers
        return (
          <button
            onClick={() =>
              navigate(
                `/vehicles/orders/${orderId}/unit-edit/${booking.vehicleIndex}`,
              )
            }
            className={`${cls} bg-blue-600 hover:bg-blue-700`}
          >
            <FilePenLine size={14} />
            {getNumberActionLabel(booking)}
          </button>
        );
      }

      case "chassis_received": {
        const pi = hasGeneratedPI(booking);

        // PI created → can ship (chassis is always present at this status)
        if (pi) {
          return (
            <button
              onClick={() => handleShip(booking)}
              className={`${cls} bg-cyan-600 hover:bg-cyan-700`}
            >
              <Truck size={14} />
              Ship Vehicle
            </button>
          );
        }

        // No PI, engine missing → create PI (vehicle is in "Make PI" card)
        if (!hasEngine(booking)) {
          return (
            <button
              onClick={() =>
                // navigate(
                //   `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
                // )
                navigate(`/proforma-invoice/list`)
              }
              className={`${cls} bg-purple-600 hover:bg-purple-700`}
            >
              <FileText size={14} />
              Create PI
            </button>
          );
        }

        // Both numbers present, no PI → create PI
        return (
          <button
            onClick={() =>
              // navigate(
              //   `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
              // )
              navigate(`/proforma-invoice/list`)
            }
            className={`${cls} bg-purple-600 hover:bg-purple-700`}
          >
            <FileText size={14} />
            Create PI
          </button>
        );
      }

      case "shipped":
        return (
          <button
            onClick={() => openDeliveredConfirmation(booking)}
            className={`${cls} bg-[#1e40af] hover:bg-[#1d4ed8]`}
          >
            <Truck size={14} />
            Mark Delivered
          </button>
        );

      case "cancelled":
        return (
          <button
            onClick={() =>
              navigate(
                `/vehicles/orders/${orderId}/unit-view/${booking.vehicleIndex}`,
              )
            }
            className={`${cls} bg-indigo-600 hover:bg-indigo-700`}
          >
            Found Replacement
          </button>
        );

      default:
        return null;
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     SUMMARY CARDS
     ══════════════════════════════════════════════════════════════════ */
  const summaryCards = useMemo(() => {
    if (isClient) {
      return [
        {
          label: "ORDERS PLACED",
          filterLabel: "ORDERS PLACED",
          value: bookingStats.ordersPlaced,
          detail: "Total vehicles placed by you or our team",
          icon: <CarFront size={20} />,
          tone: "bg-blue-50 text-blue-700 border-blue-100",
        },
        {
          label: "AWAITING VIN",
          filterLabel: "AWAITING VIN",
          value: bookingStats.awaitingVin,
          detail: "Booked, awaiting chassis/VIN number",
          icon: <Hash size={20} />,
          tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
        },
        {
          label: "PENDING LC",
          filterLabel: "PENDING LC",
          value: bookingStats.pendingLc,
          detail: "PI created, LC not yet received",
          icon: <FileText size={20} />,
          tone: "bg-amber-50 text-amber-700 border-amber-100",
        },
        {
          label: "LC RECEIVED",
          filterLabel: "LC RECEIVED",
          value: bookingStats.lcReceived,
          detail: "LC received, awaiting shipment",
          icon: <FileCheck size={20} />,
          tone: "bg-green-50 text-green-700 border-green-100",
        },
        {
          label: "CARS IN TRANSIT",
          filterLabel: "CARS IN TRANSIT",
          value: bookingStats.carsInTransit,
          detail: "LC received and shipped",
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
        {
          label: "CANCELLED VEHICLES",
          filterLabel: "CANCELLED VEHICLES",
          value: bookingStats.cancelledVehicles,
          detail: "Cancelled vehicles",
          icon: <AlertCircle size={20} />,
          tone: "bg-rose-50 text-rose-700 border-rose-100",
        },
      ];
    }

    // ADMIN CARDS (8 cards)
    return [
      {
        label: "Action Required",
        filterLabel: "Action Required",
        value: bookingStats.pendingTotal,
        detail: "Vehicles added, no action performed",
        icon: <AlertCircle size={20} />,
        tone: "bg-slate-100 text-slate-800 border-slate-200",
      },
      {
        label: "Awaiting Approval",
        filterLabel: "Awaiting Approval",
        value: bookingStats.approvalTotal,
        detail: "Dealer allotted, quotation uploaded, costing added",
        icon: <Clock size={20} />,
        tone: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        label: "Awaiting Booking",
        filterLabel: "Awaiting Booking",
        value: bookingStats.approvedTotal,
        detail: "Approved but not yet booked",
        icon: <CheckCircle size={20} />,
        tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      {
        label: "Awaiting Numbers",
        filterLabel: "Awaiting Numbers",
        value: bookingStats.awaitingNumbersTotal,
        detail: "Booked, chassis/engine still pending",
        icon: <Hash size={20} />,
        tone: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        label: "Make PI",
        filterLabel: "Make PI",
        value: bookingStats.makePiTotal,
        detail: "Chassis received, ready for PI creation",
        icon: <FileText size={20} />,
        tone: "bg-purple-100 text-purple-800 border-purple-200",
      },
      {
        label: "Shipped",
        filterLabel: "Shipped",
        value: bookingStats.shippedTotal,
        detail: "PI created, vehicle shipped",
        icon: <Truck size={20} />,
        tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
      },
      {
        label: "Delivered",
        filterLabel: "Delivered",
        value: bookingStats.deliveredTotal,
        detail: "Vehicle delivered to client",
        icon: <PackageCheck size={20} />,
        tone: "bg-green-100 text-green-800 border-green-200",
      },
      {
        label: "Cancelled Vehicles",
        filterLabel: "Cancelled Vehicles",
        value: bookingStats.cancelledTotal,
        detail: "Cancelled vehicles",
        icon: <AlertCircle size={20} />,
        tone: "bg-rose-100 text-rose-800 border-rose-200",
      },
    ];
  }, [bookingStats, isClient]);

  // ─── PAGE META ──────────────────────────────────────────────────
  const pageTitle = isClient ? "My Vehicle List" : "Vehicles List";
  const pageDescription = isClient
    ? "View the vehicle orders assigned to your account"
    : "Track and manage vehicle list unit-wise";

  const confirmationMissingInvoices =
    confirmation?.action === "deliver" &&
    !hasReadyToShipInvoices(confirmation.booking);

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        {/* ─── HEADER ─── */}
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

        {/* ─── FILTER BAR ─── */}
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
                {(isClient ? CLIENT_STATUS_OPTIONS : ADMIN_STATUS_OPTIONS).map(
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

        {/* ─── SUMMARY CARDS ─── */}
        <div className="px-8 pb-4">
          <div
            className={`grid gap-4 grid-cols-2 md:grid-cols-3 ${isClient ? "xl:grid-cols-7" : "lg:grid-cols-4 xl:grid-cols-8"}`}
          >
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

        {/* ─── TABLE ─── */}
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
                      Est. Collection Date
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

                    const isCancelled = booking.status === "cancelled";
                    return (
                      <tr
                        key={booking._id}
                        className={`align-middle transition-colors duration-200 ${
                          isCancelled
                            ? "bg-rose-50/30 hover:bg-rose-100/40 text-rose-950 dark:bg-rose-950/10 dark:hover:bg-rose-900/20"
                            : "hover:bg-blue-50/30"
                        }`}
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

        {/* ─── PAGINATION ─── */}
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

      {/* ─── MODALS ─── */}
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

      {/* ─── DELIVERED CONFIRMATION ─── */}
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
                ? "Invoices aren't created for this vehicle. Are you sure you want to mark it as delivered?"
                : "Are you sure you want to mark this vehicle as delivered?"}
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
