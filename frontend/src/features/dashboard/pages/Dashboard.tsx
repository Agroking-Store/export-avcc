import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CarFront,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  Globe2,
  Landmark,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";

/* ─────────────────────── types ──────────────────────────── */
type VehicleBookingStatus =
  | "pending"
  | "quotation_details_pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
  | "shipped"
  | "delivered";
type PIStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent_to_buyer"
  | "lc_received"
  | "expired";

interface ClientItem {
  _id: string;
  name: string;
  isActive?: boolean;
  address?: { country?: string };
}
interface CompanyItem {
  _id: string;
  name: string;
  isActive?: boolean;
  address?: { country?: string };
}
interface DealerItem {
  _id: string;
  name: string;
  gstNumber?: string;
}
interface VehicleBookingItem {
  _id: string;
  status: VehicleBookingStatus;
  createdAt?: string;
  updatedAt?: string;
  deliveryDate?: string;
  engineNumber?: string;
  chassisNumber?: string;
  assignedClientId?: string;
  assignedDealerId?: string;
  assignedClientSnapshot?: { name?: string };
  assignedDealerSnapshot?: { name?: string };
  isCRTMUploaded?: boolean;
  isBVUploaded?: boolean;
  isDealerInvoiceUploaded?: boolean;
  piGenerated?: boolean;
  associatedPIs?: Array<{
    _id: string;
    piNumber?: string;
    status?: string;
  }>;
  orderId?:
    | string
    | {
        orderNumber?: string;
        vehicleSnapshot?: { brandName?: string; modelName?: string };
      };
}
interface ProformaInvoiceItem {
  _id: string;
  piNumber: string;
  status: PIStatus;
  totalAmount?: number;
  validityDate?: string;
  createdAt?: string;
  client_id?: { name?: string };
  clientSnapshot?: { name?: string };
}
interface UserItem {
  _id: string;
  name: string;
  role: string;
}
interface DashboardCollections {
  clients: ClientItem[];
  companies: CompanyItem[];
  dealers: DealerItem[];
  vehicleBookings: VehicleBookingItem[];
  proformaInvoices: ProformaInvoiceItem[];
  users: UserItem[];
}
interface ClientDashboardProfile {
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    address?: {
      houseBuilding?: string;
      streetArea?: string;
      cityTown?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  vehicleOrders: VehicleBookingItem[];
  totalVehicleOrders: number;
  lastBooking: string | null;
}

const EMPTY: DashboardCollections = {
  clients: [],
  companies: [],
  dealers: [],
  vehicleBookings: [],
  proformaInvoices: [],
  users: [],
};

/* ─── Status Flows ─── */
const BOOKING_FLOW: Array<{
  status: VehicleBookingStatus;
  label: string;
  color: string;
}> = [
  { status: "pending", label: "Pending", color: "#93c5fd" },
  {
    status: "quotation_details_pending",
    label: "Waiting For Approval",
    color: "#60a5fa",
  },
  {
    status: "quotation_uploaded",
    label: "Waiting for Approval",
    color: "#fbbf24",
  },
  { status: "approved", label: "Approved", color: "#34d399" },
  { status: "rejected", label: "Rejected", color: "#f87171" },
  {
    status: "payment_done",
    label: "Awaiting Engine / Chassis Number",
    color: "#60a5fa",
  },
  { status: "chassis_received", label: "Ready to Ship", color: "#a78bfa" },
  { status: "shipped", label: "Shipped / In Transit", color: "#22d3ee" },
  { status: "delivered", label: "Delivered", color: "#4ade80" },
];

const PI_FLOW: Array<{ status: PIStatus; label: string; color: string }> = [
  { status: "draft", label: "Draft", color: "#93c5fd" },
  { status: "pending_approval", label: "Pending Approval", color: "#fbbf24" },
  { status: "approved", label: "Approved", color: "#34d399" },
  { status: "sent_to_buyer", label: "Sent to Client", color: "#60a5fa" },
  { status: "lc_received", label: "LC Received", color: "#a78bfa" },
  { status: "expired", label: "Expired", color: "#f87171" },
];

/* ─── Client Abstraction Mapping ─── */
const CLIENT_SAFE_FLOW = [
  {
    key: "processing",
    label: "Order Processing",
    color: "#94a3b8",
    statuses: ["pending", "quotation_details_pending"],
  },
  {
    key: "action",
    label: "Awaiting Your Review",
    color: "#fbbf24",
    statuses: ["quotation_uploaded"],
  },
  {
    key: "confirmed",
    label: "Confirmed & Sourcing",
    color: "#60a5fa",
    statuses: ["approved", "payment_done"],
  },
  {
    key: "transit",
    label: "In Transit",
    color: "#a78bfa",
    statuses: ["chassis_received"],
  },
  {
    key: "delivered",
    label: "Delivered",
    color: "#4ade80",
    statuses: ["delivered"],
  },
];

/* ─── Helper Functions ─── */
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
const readCollection = <T,>(p: any): T[] =>
  Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
const fmtCurrency = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${Math.round(v).toLocaleString()}`;
const fmtDate = (v?: string) =>
  !v
    ? "—"
    : new Date(v).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
const daysUntil = (v?: string) =>
  v ? Math.ceil((new Date(v).getTime() - Date.now()) / 86_400_000) : null;
const getVehicleName = (b: VehicleBookingItem) => {
  const oid = b.orderId as any;
  if (oid && typeof oid === "object") {
    const n =
      `${oid.vehicleSnapshot?.brandName || ""} ${oid.vehicleSnapshot?.modelName || ""}`.trim();
    return n || oid.orderNumber || "Vehicle";
  }
  return "Vehicle";
};
const bookingStatusCls = (s: VehicleBookingStatus) =>
  ({
    pending: "bg-slate-50 text-slate-600 border-slate-200",
    quotation_details_pending: "bg-blue-50 text-blue-700 border-blue-200",
    quotation_uploaded: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    payment_done: "bg-blue-50 text-blue-700 border-blue-200",
    chassis_received: "bg-indigo-50 text-indigo-700 border-indigo-200",
    shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
  })[s] ?? "bg-slate-50 text-slate-500 border-slate-200";

const piStatusCls = (s: PIStatus) =>
  ({
    draft: "bg-slate-50 text-slate-600 border-slate-200",
    pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sent_to_buyer: "bg-blue-50 text-blue-700 border-blue-200",
    lc_received: "bg-indigo-50 text-indigo-700 border-indigo-200",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
  })[s] ?? "bg-slate-50 text-slate-500 border-slate-200";

// ═══════════════════════════════════════════════════════════════════
// CLIENT CARD BUCKET HELPERS
// ═══════════════════════════════════════════════════════════════════
const hasGeneratedPI = (b: VehicleBookingItem): boolean =>
  b.piGenerated ||
  (Array.isArray((b as any).associatedPIs) &&
    (b as any).associatedPIs.length > 0);

const hasLcReceived = (b: VehicleBookingItem): boolean => {
  const pis = Array.isArray((b as any).associatedPIs)
    ? (b as any).associatedPIs
    : [];
  return pis.length > 0 && pis.some((pi: any) => pi?.status === "lc_received");
};

const getClientCards = (b: VehicleBookingItem): string[] => {
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

  if (["approved", "payment_done"].includes(b.status)) {
    cards.push("AWAITING VIN");
    return cards;
  }

  if (b.status === "chassis_received") {
    if (hasGeneratedPI(b)) {
      cards.push("PENDING LC");
    } else {
      cards.push("AWAITING VIN");
    }
    return cards;
  }

  return cards;
};

/* ─── Shared UI Components ─── */
const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
}> = ({ value, prefix = "", suffix = "" }) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    const from = display;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / 1400, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * e));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      startRef.current = null;
    };
  }, [value]);
  return (
    <>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </>
  );
};

const ParticleCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = canvas.offsetWidth,
      h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;
    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
    }));
    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/* ═══════════════════════ MAIN DASHBOARD ════════════════════════ */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isClient, user } = useAuth();
  const [data, setData] = useState<DashboardCollections>(EMPTY);
  const [clientProfile, setClientProfile] =
    useState<ClientDashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [momentumMonths, setMomentumMonths] = useState<3 | 6>(6);
  const [mounted, setMounted] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<
    "1d" | "1w" | "1m" | "all"
  >("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      if (isClient) {
        try {
          const response = await api.get("/clients/me");
          if (alive) setClientProfile(response.data);
        } catch (error) {
          console.error("Client fetch error", error);
        } finally {
          if (alive) {
            setLoading(false);
            setTimeout(() => setMounted(true), 60);
          }
        }
        return;
      }

      const reqs = [
        {
          key: "clients",
          req: api.get("/clients", { params: { page: 1, limit: 2000 } }),
        },
        {
          key: "companies",
          req: api.get("/companies", {
            params: { page: 1, limit: 2000, status: "all" },
          }),
        },
        {
          key: "dealers",
          req: api.get("/dealers", { params: { page: 1, limit: 2000 } }),
        },
        {
          key: "vehicleBookings",
          req: api.get("/vehicle-bookings", {
            params: { page: 1, limit: 2000 },
          }),
        },
        {
          key: "proformaInvoices",
          req: api.get("/proforma-invoices", {
            params: { page: 1, limit: 2000, status: "all" },
          }),
        },
        ...(isAdmin ? [{ key: "users", req: api.get("/users") }] : []),
      ];
      const results = await Promise.allSettled(reqs.map((r) => r.req));
      if (!alive) return;
      const next = { ...EMPTY } as any;
      results.forEach((res, i) => {
        if (res.status === "fulfilled")
          next[reqs[i].key] = readCollection<any>(res.value.data);
      });
      setData(next);
      setLoading(false);
      setTimeout(() => setMounted(true), 60);
    })();
    return () => {
      alive = false;
    };
  }, [isAdmin, isClient]);

  /* ─────────────────────── ADMIN MEMOS ──────────────────────────── */
  const m = useMemo(() => {
    const activePiStatuses: PIStatus[] = [
      "pending_approval",
      "approved",
      "sent_to_buyer",
    ];
    const delivered = data.vehicleBookings.filter(
      (b) => b.status === "delivered",
    ).length;
    const pipelineValue = data.proformaInvoices
      .filter((p) => activePiStatuses.includes(p.status))
      .reduce((t, p) => t + Number(p.totalAmount || 0), 0);
    const awaitingLc = data.proformaInvoices.filter(
      (p) => p.status === "sent_to_buyer" || p.status === "approved",
    ).length;
    const expiringPi = data.proformaInvoices.filter((p) => {
      const d = daysUntil(p.validityDate);
      return (
        d !== null &&
        d >= 0 &&
        d <= 7 &&
        !["lc_received", "expired"].includes(p.status)
      );
    }).length;
    const docBacklog = data.vehicleBookings.filter(
      (b) =>
        (b.status === "chassis_received" || b.status === "delivered") &&
        (!b.isCRTMUploaded || !b.isBVUploaded || !b.isDealerInvoiceUploaded),
    ).length;
    const piReady = data.vehicleBookings.filter(
      (b) => b.engineNumber && b.chassisNumber && !b.piGenerated,
    ).length;
    return {
      delivered,
      piReady,
      pipelineValue,
      awaitingLc,
      expiringPi,
      docBacklog,
      inFlight: data.vehicleBookings.filter((b) =>
        ["approved", "payment_done", "chassis_received", "shipped"].includes(
          b.status,
        ),
      ).length,
      countries: new Set(
        [
          ...data.clients.map((c) => c.address?.country),
          ...data.companies.map((c) => c.address?.country),
        ].filter(Boolean),
      ).size,
      deliveryCompletion:
        data.vehicleBookings.length > 0
          ? Math.round((delivered / data.vehicleBookings.length) * 100)
          : 0,
      lcCompletion:
        data.proformaInvoices.length > 0
          ? Math.round(
              (data.proformaInvoices.filter((p) => p.status === "lc_received")
                .length /
                data.proformaInvoices.length) *
                100,
            )
          : 0,
    };
  }, [data]);

  const bookingCounts = useMemo(() => {
    const c: any = {};
    BOOKING_FLOW.forEach((f) => (c[f.status] = 0));
    data.vehicleBookings.forEach((b) => {
      if (c[b.status] !== undefined) c[b.status]++;
    });
    return c;
  }, [data.vehicleBookings]);

  const piCounts = useMemo(() => {
    const c: any = {};
    PI_FLOW.forEach((f) => (c[f.status] = 0));
    data.proformaInvoices.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, [data.proformaInvoices]);

  const trendData = useMemo(() => {
    const months = Array.from({ length: momentumMonths }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (momentumMonths - 1 - i));
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_FMT.format(d),
        invoices: 0,
        deliveries: 0,
      };
    });
    const map = new Map(months.map((m) => [m.key, m]));
    data.proformaInvoices.forEach((p) => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const b = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (b) b.invoices++;
    });
    data.vehicleBookings.forEach((bk) => {
      if (bk.status !== "delivered") return;
      const raw = bk.deliveryDate || bk.updatedAt || bk.createdAt;
      if (!raw) return;
      const d = new Date(raw);
      const b = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (b) b.deliveries++;
    });
    return months;
  }, [data, momentumMonths]);

  /* ─────────────────────── CLIENT MEMOS ──────────────────────────── */
  const clientStats = useMemo(() => {
    if (!clientProfile) return null;
    const orders = clientProfile.vehicleOrders || [];

    const cardCounts: Record<string, number> = {
      "ORDERS PLACED": 0,
      "AWAITING VIN": 0,
      "PENDING LC": 0,
      "LC RECEIVED": 0,
      "CARS IN TRANSIT": 0,
      "CARS DELIVERED": 0,
    };

    orders.forEach((b) => {
      const cards = getClientCards(b);
      cards.forEach((card) => {
        cardCounts[card] = (cardCounts[card] || 0) + 1;
      });
    });

    const scheduledVehicles = orders
      .filter((order) => order.deliveryDate)
      .sort(
        (a, b) =>
          new Date(a.deliveryDate || 0).getTime() -
          new Date(b.deliveryDate || 0).getTime(),
      );
    const nextEstimatedCollection = scheduledVehicles[0]?.deliveryDate;

    return {
      total: clientProfile.totalVehicleOrders,
      ordersPlaced: cardCounts["ORDERS PLACED"],
      awaitingVin: cardCounts["AWAITING VIN"],
      pendingLc: cardCounts["PENDING LC"],
      lcReceived: cardCounts["LC RECEIVED"],
      carsInTransit: cardCounts["CARS IN TRANSIT"],
      carsDelivered: cardCounts["CARS DELIVERED"],
      estimatedCollectionDate: nextEstimatedCollection
        ? fmtDate(nextEstimatedCollection)
        : "-",
      estimatedCollectionCount: scheduledVehicles.length,
      scheduledVehicles,
    };
  }, [clientProfile]);

  const filteredScheduledVehicles = useMemo(() => {
    const vehicles = clientStats?.scheduledVehicles ?? [];
    if (collectionFilter === "all") return vehicles;
    const now = Date.now();
    const ms =
      collectionFilter === "1d"
        ? 86_400_000
        : collectionFilter === "1w"
          ? 7 * 86_400_000
          : 30 * 86_400_000;
    return vehicles.filter((v) => {
      if (!v.deliveryDate) return false;
      const diff = new Date(v.deliveryDate).getTime() - now;
      return diff >= 0 && diff <= ms;
    });
  }, [clientStats, collectionFilter]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
          Initialising Workspace...
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     CLIENT DASHBOARD VIEW
     ══════════════════════════════════════════════════════════ */
  if (isClient && clientProfile && clientStats) {
    const clientCards = [
      {
        label: "ORDERS PLACED",
        value: clientStats.ordersPlaced,
        detail: "Total vehicles placed by you or our team",
        icon: <CarFront size={20} />,
        tone: "bg-blue-50 text-blue-700 border-blue-100",
      },
      {
        label: "AWAITING VIN",
        value: clientStats.awaitingVin,
        detail: "Booked, awaiting chassis/VIN number",
        icon: <CarFront size={20} />,
        tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
      },
      {
        label: "PENDING LC",
        value: clientStats.pendingLc,
        detail: "PI created, LC not yet received",
        icon: <FileText size={20} />,
        tone: "bg-amber-50 text-amber-700 border-amber-100",
      },
      {
        label: "LC RECEIVED",
        value: clientStats.lcReceived,
        detail: "LC received, awaiting shipment",
        icon: <FileCheck2 size={20} />,
        tone: "bg-green-50 text-green-700 border-green-100",
      },
      {
        label: "CARS IN TRANSIT",
        value: clientStats.carsInTransit,
        // value: bookingStats.carsInTransit,
        detail: "LC received and shipped",
        icon: <Truck size={20} />,
        tone: "bg-cyan-50 text-cyan-700 border-cyan-100",
      },
      {
        label: "CARS DELIVERED",
        value: clientStats.carsDelivered,
        detail: "Delivered vehicles",
        icon: <PackageCheck size={20} />,
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
    ];

    return (
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(160deg,#f0f6ff 0%,#f7faff 50%,#eaf3ff 100%)",
        }}
      >
        {/* subtle dot grid */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle,#bfdbfe 1px,transparent 1px)",
            backgroundSize: "30px 30px",
            opacity: 0.22,
          }}
        />

        <div className="relative mx-auto max-w-[1500px] px-6 py-8 space-y-6">
          {/* ── WELCOME HERO ── */}
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, #0f2d6e 0%, #1648b8 35%, #1e6fcc 62%, #0e4fa8 82%, #0a3580 100%)",
              boxShadow: "0 24px 80px -12px rgba(14,45,110,0.50)",
              minHeight: 200,
            }}
          >
            <ParticleCanvas />
            {/* decorative rings */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white/10" />
            <div className="absolute right-24 bottom-[-40px] w-80 h-80 rounded-full border border-white/5" />

            <div className="relative px-8 py-9 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-xl">
                {/* live badge */}
                <div
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-300 opacity-80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                    {greeting}
                  </span>
                </div>

                <h1 className="text-[30px] font-bold leading-tight tracking-tight text-white">
                  {clientProfile.client.companyName}
                </h1>
                <p className="mt-2 text-[14px] text-blue-100/75 max-w-sm leading-relaxed">
                  Track your vehicle orders, shipments, LC status, and
                  deliveries — all in one place.
                </p>
              </div>

              <button
                onClick={() => navigate("/vehicles/orders")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[13px] font-bold text-white transition-all hover:scale-[1.03] cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(12px)",
                }}
              >
                View Vehicle List
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* ── STAT CARDS (6 cards) ── */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {clientCards.map((card) => (
              <div
                key={card.label}
                className="group relative rounded-2xl border bg-white p-5 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* subtle accent line at top */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-60"
                  style={{
                    background: card.tone.includes("blue")
                      ? "linear-gradient(90deg,#3b82f6,#6366f1)"
                      : card.tone.includes("indigo")
                        ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
                        : card.tone.includes("amber")
                          ? "linear-gradient(90deg,#f59e0b,#f97316)"
                          : card.tone.includes("green")
                            ? "linear-gradient(90deg,#10b981,#34d399)"
                            : card.tone.includes("cyan")
                              ? "linear-gradient(90deg,#06b6d4,#3b82f6)"
                              : "linear-gradient(90deg,#10b981,#06b6d4)",
                  }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${card.tone.split(" ").find((c) => c.startsWith("text-"))}`}
                    >
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900 leading-none">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-2.5 ${card.tone
                      .split(" ")
                      .filter(
                        (c) => c.startsWith("bg-") || c.startsWith("text-"),
                      )
                      .join(" ")}`}
                    style={{ background: "rgba(255,255,255,0.7)" }}
                  >
                    {card.icon}
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-slate-400">{card.detail}</p>
              </div>
            ))}
          </div>

          {/* ── ESTIMATED COLLECTION DATES TABLE ── */}
          <div className="rounded-3xl border border-blue-100/60 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Estimated Collection Dates
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dates entered by the team as the expected collection date from
                  the dealership.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Time-range dropdown */}
                <select
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value as any)}
                  className="text-[12px] font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer bg-white text-slate-700 hover:border-blue-300 transition-colors"
                >
                  <option value="1d">Next 1 Day</option>
                  <option value="1w">Next 1 Week</option>
                  <option value="1m">Next 1 Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Chassis</th>
                    <th className="px-6 py-4">Estimated Collection Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScheduledVehicles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-slate-400"
                      >
                        {collectionFilter === "all"
                          ? "No estimated collection dates added yet."
                          : `No vehicles scheduled in the selected time range.`}
                      </td>
                    </tr>
                  ) : (
                    filteredScheduledVehicles.slice(0, 8).map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {getVehicleName(order)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {order.chassisNumber || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {fmtDate(order.deliveryDate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     ADMIN DASHBOARD VIEW (ORIGINAL FULL CODE)
     ══════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg,#f0f6ff 0%,#f7faff 50%,#eaf3ff 100%)",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle,#bfdbfe 1px,transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.28,
        }}
      />

      <div
        className="relative max-w-[1600px] mx-auto px-6 py-8 space-y-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(14px)",
          transition: "all 0.5s ease",
        }}
      >
        {/* ADMIN HERO */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, #0f2d6e 0%, #1648b8 30%, #1e6fcc 58%, #0e4fa8 80%, #0a3580 100%)",
            boxShadow: "0 24px 80px -12px rgba(14,45,110,0.55)",
            minHeight: 260,
          }}
        >
          <ParticleCanvas />
          <div className="relative px-8 py-9 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div className="max-w-lg">
              <div
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-300 opacity-80" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                  Live Operations
                </span>
              </div>
              <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white mb-3 uppercase">
                Vehicle Export
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg,#93c5fd,#c7d2fe)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Command Center
                </span>
              </h1>
              <p className="text-[14px] leading-relaxed max-w-xs text-blue-100/80">
                Real-time visibility across sourcing, documentation & dispatch.
              </p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-2 gap-3 xl:min-w-[460px]">
              <HeroKpi
                label="Pipeline Value"
                value={fmtCurrency(m.pipelineValue)}
                sub={`${data.proformaInvoices.length} PI documents`}
                icon={<FileCheck2 size={17} />}
                accent="#60a5fa"
              />
              <HeroKpi
                label="Delivery Rate"
                value={`${m.deliveryCompletion}%`}
                sub={`${m.delivered} units delivered`}
                icon={<Truck size={17} />}
                accent="#34d399"
              />
              <HeroKpi
                label="LC Completion"
                value={`${m.lcCompletion}%`}
                sub="PI documents closed"
                icon={<PackageCheck size={17} />}
                accent="#a78bfa"
              />
              <HeroKpi
                label="Countries"
                value={String(m.countries)}
                sub="Global network footprint"
                icon={<Globe2 size={17} />}
                accent="#fbbf24"
              />
            </div>
          </div>
        </div>

        {/* ADMIN KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ">
          <SummaryCard
            label="Business Network"
            num={data.clients.length + data.dealers.length}
            detail={`${data.clients.length} clients · ${data.dealers.length} dealers`}
            icon={<Building2 size={18} />}
            g={["#2563eb", "#1d4ed8"]}
            dest="/clients/dashboard"
            navigate={navigate}
          />
          <SummaryCard
            label="Vehicle Bookings"
            num={data.vehicleBookings.length}
            detail={`${m.inFlight} units in active pipeline`}
            icon={<CarFront size={18} />}
            g={["#6366f1", "#4f46e5"]}
            dest="/vehicles/dashboard"
            navigate={navigate}
          />
          <SummaryCard
            label="Cars Ready For PI"
            num={m.piReady}
            detail="Engine and chassis filled, PI pending"
            icon={<ClipboardCheck size={18} />}
            g={["#059669", "#047857"]}
            dest="/vehicles/orders"
            navigate={navigate}
          />
          <SummaryCard
            label="Proforma Invoices"
            num={data.proformaInvoices.length}
            detail={`${m.awaitingLc} PIs awaiting buyer LC`}
            icon={<FileText size={18} />}
            g={["#0284c7", "#0369a1"]}
            dest="/proforma-invoice/dashboard"
            navigate={navigate}
          />
        </div>



        {/* MOMENTUM CHART */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
          <div className="bg-white p-6 rounded-2xl border border-blue-100/50 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[17px] font-bold text-slate-900 uppercase">
                Momentum Trend
              </h2>
              <select
                value={momentumMonths}
                onChange={(e) =>
                  setMomentumMonths(Number(e.target.value) as 3 | 6)
                }
                className="text-[11px] font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
              </select>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="invoices"
                    stroke="#3b82f6"
                    fill="url(#g1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="deliveries"
                    stroke="#10b981"
                    fill="url(#g2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <PieCard
            title="Booking Distribution"
            total={data.vehicleBookings.length}
            pieData={BOOKING_FLOW.map((f) => ({
              name: f.label,
              value: bookingCounts[f.status],
              color: f.color,
            })).filter((d) => d.value > 0)}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── SHARED UI SUB-COMPONENTS ─── */

const HeroKpi = ({ label, value, sub, icon, accent }: any) => (
  <div
    className="relative rounded-2xl p-4 overflow-hidden group transition-all duration-300 hover:scale-[1.03]"
    style={{
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(14px)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/70">
        {label}
      </p>
      <div
        className="p-1.5 rounded-lg"
        style={{ background: "rgba(255,255,255,0.12)", color: accent }}
      >
        {icon}
      </div>
    </div>
    <p className="text-[26px] font-bold text-white tabular-nums leading-none mb-1">
      {value}
    </p>
    <p className="text-[11px] text-blue-100/50 font-medium">{sub}</p>
  </div>
);

const SummaryCard = ({ label, num, detail, icon, g, dest, navigate }: any) => (
  <button
    onClick={() => dest && navigate(dest)}
    className="text-left rounded-2xl bg-white p-5 border border-blue-100 shadow-sm transition-all hover:-translate-y-1 cursor-pointer"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-md"
      style={{ background: `linear-gradient(135deg,${g[0]},${g[1]})` }}
    >
      {icon}
    </div>
    <p className="text-3xl font-bold text-slate-900 tabular-nums">
      <AnimatedNumber value={num} />
    </p>
    <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">
      {label}
    </p>
    {detail && <p className="text-[12px] text-slate-400 mt-1">{detail}</p>}
  </button>
);

const WatchButton = ({ label, value, urgent, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left  cursor-pointer transition-all ${urgent ? "bg-rose-50 border border-rose-100" : "bg-blue-50/50 border border-blue-50"}`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`p-1.5 rounded-lg ${urgent ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-blue-500"}`}
      >
        {icon}
      </div>
      <p
        className={`text-[12px] font-bold truncate uppercase ${urgent ? "text-rose-700" : "text-slate-600"}`}
      >
        {label}
      </p>
    </div>
    <span
      className={`text-[14px] font-bold tabular-nums ${urgent ? "text-rose-500" : "text-blue-500"}`}
    >
      {value}
    </span>
  </button>
);

const FlowCard: React.FC<{
  title: string;
  subtitle: string;
  accentColors: [string, string];
  rows: any[];
  action: any;
  navigate: any;
}> = ({ title, subtitle, accentColors, rows, action, navigate }) => (
  <div className="rounded-2xl bg-white p-6 border border-blue-100/50 shadow-sm">
    <div className="flex items-start justify-between mb-5">
      <div>
        <div
          className="w-8 h-1 rounded-full mb-3"
          style={{
            background: `linear-gradient(90deg,${accentColors[0]},${accentColors[1]})`,
          }}
        />
        <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-[12px] text-slate-400 mt-1">{subtitle}</p>
      </div>
      <button
        onClick={() => navigate(action.dest)}
        className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase hover:bg-blue-100 transition-colors cursor-pointer"
      >
        {action.label}
      </button>
    </div>
    <div className="space-y-4">
      {rows.map((row) => {
        const pct = row.total > 0 ? (row.value / row.total) * 100 : 0;
        return (
          <div key={row.label}>
            <div className="flex justify-between text-[11px] font-bold uppercase mb-1.5">
              <span className="text-slate-500">{row.label}</span>
              <span className="text-slate-900">{row.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${pct}%`, background: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const PieCard = ({ title, total, pieData }: any) => (
  <div className="rounded-2xl bg-white p-6 border border-blue-100/50 shadow-sm">
    <h2 className="text-[16px] font-bold text-slate-900 uppercase mb-5">
      {title}
    </h2>
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((e: any, i: number) => (
                <Cell key={i} fill={e.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-slate-900 leading-none">
            {total}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
            Units
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {pieData.slice(0, 5).map((d: any) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-[10px] font-bold uppercase"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: d.color }}
              />{" "}
              {d.name}
            </div>
            <span>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Dashboard;