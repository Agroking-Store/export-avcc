import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CarFront,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  Globe2,
  Landmark,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Gauge,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Activity,
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";

type VehicleBookingStatus =
  | "pending"
  | "quotation_uploaded"
  | "approved"
  | "rejected"
  | "payment_done"
  | "chassis_received"
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
interface ExportOrderItem {
  _id: string;
  orderId: string;
  date?: string;
  createdAt?: string;
  status: string;
  clientName?: string;
  companyName?: string;
  vehicles?: Array<{ quantity?: number }>;
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
  orderId?: string | { orderNumber?: string; vehicleSnapshot?: { brandName?: string; modelName?: string; variant?: string } };
}
interface ProformaInvoiceItem {
  _id: string;
  piNumber: string;
  status: PIStatus;
  totalAmount?: number;
  validityDate?: string;
  createdAt?: string;
  client_id?: { name?: string };
  company_id?: { name?: string };
  clientSnapshot?: { name?: string };
  companySnapshot?: { name?: string };
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
  orders: ExportOrderItem[];
  vehicleBookings: VehicleBookingItem[];
  proformaInvoices: ProformaInvoiceItem[];
  users: UserItem[];
}

const EMPTY: DashboardCollections = {
  clients: [], companies: [], dealers: [], orders: [],
  vehicleBookings: [], proformaInvoices: [], users: [],
};

const BOOKING_FLOW: Array<{ status: VehicleBookingStatus; label: string; color: string }> = [
  { status: "pending",            label: "Quotation Pending",  color: "#94a3b8" },
  { status: "quotation_uploaded", label: "Awaiting Approval",  color: "#f59e0b" },
  { status: "approved",           label: "Approved",           color: "#10b981" },
  { status: "rejected",           label: "Rejected",           color: "#f43f5e" },
  { status: "payment_done",       label: "Awaiting Numbers",   color: "#3b82f6" },
  { status: "chassis_received",   label: "In Transit",         color: "#6366f1" },
  { status: "delivered",          label: "Delivered",          color: "#059669" },
];

const PI_FLOW: Array<{ status: PIStatus; label: string; color: string }> = [
  { status: "draft",            label: "Draft",            color: "#94a3b8" },
  { status: "pending_approval", label: "Pending Approval", color: "#f59e0b" },
  { status: "approved",         label: "Approved",         color: "#10b981" },
  { status: "sent_to_buyer",    label: "Sent to Buyer",    color: "#3b82f6" },
  { status: "lc_received",      label: "LC Received",      color: "#6366f1" },
  { status: "expired",          label: "Expired",          color: "#f43f5e" },
];

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });

const readCollection = <T,>(payload: any): T[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const fmtCurrency = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v).toLocaleString()}`;
};
const fmtDate = (v?: string) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};
const daysUntil = (v?: string) => {
  if (!v) return null;
  return Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
};
const sumUnits = (o: ExportOrderItem) =>
  (o.vehicles || []).reduce((t, v) => t + Number(v.quantity || 0), 0);
const getVehicleName = (b: VehicleBookingItem) => {
  const oid = (b as any).orderId;
  if (oid && typeof oid === "object") {
    const snap = oid.vehicleSnapshot;
    const n = `${snap?.brandName || ""} ${snap?.modelName || ""}`.trim();
    return n || oid.orderNumber || "Vehicle";
  }
  return "Vehicle";
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<DashboardCollections>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [momentumMonths, setMomentumMonths] = useState<3 | 6>(6);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const reqs = [
        { key: "clients",          req: api.get("/clients",            { params: { page: 1, limit: 2000 } }) },
        { key: "companies",        req: api.get("/companies",          { params: { page: 1, limit: 2000, status: "all" } }) },
        { key: "dealers",          req: api.get("/dealers",            { params: { page: 1, limit: 2000 } }) },
        { key: "orders",           req: api.get("/orders",             { params: { page: 1, limit: 2000 } }) },
        { key: "vehicleBookings",  req: api.get("/vehicle-bookings",   { params: { page: 1, limit: 2000 } }) },
        { key: "proformaInvoices", req: api.get("/proforma-invoices",  { params: { page: 1, limit: 2000, status: "all" } }) },
        ...(isAdmin ? [{ key: "users", req: api.get("/users") }] : []),
      ];
      const results = await Promise.allSettled(reqs.map((r) => r.req));
      const next: DashboardCollections = { ...EMPTY };
      let failed = 0;
      results.forEach((res, i) => {
        const key = reqs[i].key as keyof DashboardCollections;
        if (res.status === "fulfilled") next[key] = readCollection<any>(res.value.data) as never;
        else failed++;
      });
      if (!mounted) return;
      setData(next);
      setPartialError(failed > 0 ? `${failed} of ${reqs.length} sources unavailable.` : null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [isAdmin]);

  const m = useMemo(() => {
    const activePiStatuses: PIStatus[] = ["pending_approval", "approved", "sent_to_buyer"];
    const totalExportUnits = data.orders.reduce((t, o) => t + sumUnits(o), 0);
    const delivered = data.vehicleBookings.filter((b) => b.status === "delivered").length;
    const shipped = data.orders.filter((o) => o.status === "Shipped").length;
    const pipelineValue = data.proformaInvoices
      .filter((p) => activePiStatuses.includes(p.status))
      .reduce((t, p) => t + Number(p.totalAmount || 0), 0);
    const awaitingLc = data.proformaInvoices.filter((p) => p.status === "sent_to_buyer" || p.status === "approved").length;
    const expiringPi = data.proformaInvoices.filter((p) => {
      const d = daysUntil(p.validityDate);
      return d !== null && d >= 0 && d <= 7 && !["lc_received", "expired"].includes(p.status);
    }).length;
    const awaitingNumbers = data.vehicleBookings.filter(
      (b) => b.status === "payment_done" && (!b.engineNumber || !b.chassisNumber)
    ).length;
    const missingDealer = data.vehicleBookings.filter((b) => !b.assignedDealerId).length;
    const missingClient = data.vehicleBookings.filter((b) => !b.assignedClientId).length;
    const docBacklog = data.vehicleBookings.filter(
      (b) => (b.status === "chassis_received" || b.status === "delivered") &&
        (!b.isCRTMUploaded || !b.isBVUploaded || !b.isDealerInvoiceUploaded)
    ).length;
    const outOfStock = 0;
    const countries = new Set([
      ...data.clients.map((c) => c.address?.country),
      ...data.companies.map((c) => c.address?.country),
    ].filter(Boolean)).size;
    const orderCompletion = data.orders.length > 0 ? Math.round((shipped / data.orders.length) * 100) : 0;
    const deliveryCompletion = data.vehicleBookings.length > 0 ? Math.round((delivered / data.vehicleBookings.length) * 100) : 0;
    const inFlight = data.vehicleBookings.filter((b) => ["approved", "payment_done", "chassis_received"].includes(b.status)).length;
    return {
      totalExportUnits, delivered, shipped, pipelineValue, awaitingLc,
      expiringPi, awaitingNumbers, missingDealer, missingClient, docBacklog,
      countries, orderCompletion, deliveryCompletion, inFlight,
    };
  }, [data]);

  const bookingCounts = useMemo(() => {
    const c: Record<VehicleBookingStatus, number> = {
      pending: 0, quotation_uploaded: 0, approved: 0, rejected: 0,
      payment_done: 0, chassis_received: 0, delivered: 0,
    };
    data.vehicleBookings.forEach((b) => { c[b.status]++; });
    return c;
  }, [data.vehicleBookings]);

  const piCounts = useMemo(() => {
    const c: Record<PIStatus, number> = {
      draft: 0, pending_approval: 0, approved: 0, sent_to_buyer: 0, lc_received: 0, expired: 0,
    };
    data.proformaInvoices.forEach((p) => { c[p.status]++; });
    return c;
  }, [data.proformaInvoices]);

  const trendData = useMemo(() => {
    const months = Array.from({ length: momentumMonths }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (momentumMonths - 1 - i));
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_FMT.format(d), orders: 0, invoices: 0, deliveries: 0 };
    });
    const map = new Map(months.map((m) => [m.key, m]));
    data.orders.forEach((o) => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const bucket = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.orders++;
    });
    data.proformaInvoices.forEach((p) => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const bucket = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.invoices++;
    });
    data.vehicleBookings.forEach((b) => {
      if (b.status !== "delivered") return;
      const raw = b.deliveryDate || b.updatedAt || b.createdAt;
      if (!raw) return;
      const d = new Date(raw);
      const bucket = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.deliveries++;
    });
    return months;
  }, [data, momentumMonths]);

  const recentOrders = useMemo(() =>
    [...data.orders].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()).slice(0, 5),
    [data.orders]
  );
  const recentPIs = useMemo(() =>
    [...data.proformaInvoices].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 4),
    [data.proformaInvoices]
  );
  const recentBookings = useMemo(() =>
    [...data.vehicleBookings].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()).slice(0, 4),
    [data.vehicleBookings]
  );

  const watchlist = useMemo(() => [
    { label: "Vehicle bookings missing dealer",        value: m.missingDealer,    urgent: m.missingDealer > 0,    dest: "/vehicles/orders",           icon: <Store size={15} /> },
    { label: "Vehicle bookings missing client",        value: m.missingClient,    urgent: m.missingClient > 0,    dest: "/vehicles/orders",           icon: <Users size={15} /> },
    { label: "Bookings awaiting chassis/engine no.",   value: m.awaitingNumbers,  urgent: m.awaitingNumbers > 0,  dest: "/vehicles/orders",           icon: <Gauge size={15} /> },
    { label: "PIs expiring within 7 days",             value: m.expiringPi,       urgent: m.expiringPi > 0,       dest: "/proforma-invoice/list",     icon: <Clock3 size={15} /> },
    { label: "Documentation backlog (transit/delivered)", value: m.docBacklog,    urgent: m.docBacklog > 0,       dest: "/vehicles/orders",           icon: <FileText size={15} /> },
    { label: "PIs awaiting LC from buyer",             value: m.awaitingLc,       urgent: m.awaitingLc > 0,       dest: "/proforma-invoice/list",     icon: <FileCheck2 size={15} /> },
  ], [m]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-600 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  const totalAttention = watchlist.filter((w) => w.urgent).reduce((t, w) => t + w.value, 0);

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="max-w-[1600px] mx-auto px-6 py-7 space-y-7">

        {/* ── HERO HEADER ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-white border border-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] px-8 py-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 55%), radial-gradient(circle at 20% 80%, #6366f1 0%, transparent 40%)",
            }}
          />
          <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3.5 py-1.5 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-[0.18em]">Live Dashboard</span>
              </div>
              <h1 className="text-[28px] font-bold text-slate-950 leading-tight tracking-[-0.02em] max-w-xl">
                Vehicle Export Operations <br />
                <span className="text-slate-400 font-medium">Command Center</span>
              </h1>
              <p className="mt-2.5 text-[14px] text-slate-500 max-w-lg leading-relaxed">
                Real-time visibility across sourcing, documentation, and dispatch.
              </p>
              {partialError && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-700">
                  <AlertTriangle size={14} />
                  {partialError}
                </div>
              )}
            </div>

            {/* Hero KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:min-w-[620px]">
              {[
                {
                  label: "Pipeline Value",
                  value: fmtCurrency(m.pipelineValue),
                  sub: `${data.proformaInvoices.length} PI docs`,
                  icon: <Banknote size={16} />,
                  accent: "text-slate-700 bg-slate-100",
                },
                {
                  label: "Order Completion",
                  value: `${m.orderCompletion}%`,
                  sub: `${m.shipped} of ${data.orders.length} shipped`,
                  icon: <PackageCheck size={16} />,
                  accent: "text-slate-700 bg-slate-100",
                },
                {
                  label: "Delivery Rate",
                  value: `${m.deliveryCompletion}%`,
                  sub: `${m.delivered} of ${data.vehicleBookings.length} units`,
                  icon: <Truck size={16} />,
                  accent: "text-slate-700 bg-slate-100",
                },
                {
                  label: "Countries",
                  value: m.countries.toString(),
                  sub: "network footprint",
                  icon: <Globe2 size={16} />,
                  accent: "text-slate-700 bg-slate-100",
                },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 group hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em]">{kpi.label}</p>
                    <div className={`p-1.5 rounded-lg ${kpi.accent}`}>{kpi.icon}</div>
                  </div>
                  <p className="text-2xl font-bold text-slate-950 tracking-tight">{kpi.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SUMMARY ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "Business Network",
              value: data.clients.length + data.companies.length + data.dealers.length,
              detail: `${data.clients.length} clients · ${data.companies.length} cos · ${data.dealers.length} dealers`,
              icon: <Building2 size={18} />,
              iconBg: "bg-slate-900 text-white",
              dest: "/clients/dashboard",
            },
            {
              title: "Export Orders",
              value: data.orders.length,
              detail: `${m.totalExportUnits.toLocaleString()} total units ordered`,
              icon: <Activity size={18} />,
              iconBg: "bg-slate-900 text-white",
              dest: "/orders/list",
            },
            {
              title: "Vehicle Bookings",
              value: data.vehicleBookings.length,
              detail: `${m.inFlight} units actively in transit`,
              icon: <CarFront size={18} />,
              iconBg: "bg-slate-900 text-white",
              dest: "/vehicles/orders",
            },
            {
              title: "Proforma Invoices",
              value: data.proformaInvoices.length,
              detail: `${m.awaitingLc} PIs awaiting LC`,
              icon: <FileCheck2 size={18} />,
              iconBg: "bg-slate-900 text-white",
              dest: "/proforma-invoice/dashboard",
            },
          ].map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.dest)}
              className="group text-left rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-5 hover:border-slate-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-200 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} shadow-sm`}>
                  {card.icon}
                </div>
                <ArrowUpRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="mt-4 text-[28px] font-bold text-slate-950 tracking-tight leading-none">{card.value.toLocaleString()}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{card.title}</p>
              <p className="mt-1 text-[12px] text-slate-500">{card.detail}</p>
            </button>
          ))}
        </div>

        {/* ── MIDDLE ROW: FLOW + WATCHLIST ────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_380px] gap-5">

          {/* Vehicle Booking Flow */}
          <FlowCard
            title="Vehicle Booking Flow"
            subtitle="Unit-wise execution status"
            accentColor="#6366f1"
            rows={BOOKING_FLOW.map((f) => ({
              label: f.label,
              value: bookingCounts[f.status] || 0,
              total: data.vehicleBookings.length,
              color: f.color,
            }))}
            action={{ label: "View all bookings", dest: "/vehicles/orders" }}
            navigate={navigate}
          />

          {/* PI Flow */}
          <FlowCard
            title="PI & Payment Flow"
            subtitle="Documentation pipeline status"
            accentColor="#10b981"
            rows={PI_FLOW.map((f) => ({
              label: f.label,
              value: piCounts[f.status] || 0,
              total: data.proformaInvoices.length,
              color: f.color,
            }))}
            action={{ label: "View all PIs", dest: "/proforma-invoice/list" }}
            navigate={navigate}
          />

          {/* Watchlist */}
          <div className="rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-5 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">Attention Required</p>
                <h2 className="mt-1 text-[17px] font-bold text-slate-950">Action Watchlist</h2>
              </div>
              {totalAttention > 0 && (
                <div className="rounded-full bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 min-w-[28px] text-center">
                  {totalAttention}
                </div>
              )}
            </div>
            <div className="space-y-2 flex-1">
              {watchlist.map((w) => (
                <button
                  key={w.label}
                  onClick={() => navigate(w.dest)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-150 group ${
                    w.urgent
                      ? "bg-rose-50 border border-rose-100 hover:bg-rose-100"
                      : "bg-slate-50 border border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`shrink-0 ${w.urgent ? "text-rose-500" : "text-slate-400"}`}>{w.icon}</div>
                    <p className={`text-[12px] font-medium truncate ${w.urgent ? "text-rose-700" : "text-slate-600"}`}>{w.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[13px] font-bold ${w.urgent ? "text-rose-600" : "text-emerald-600"}`}>{w.value}</span>
                    <ChevronRight size={13} className={`${w.urgent ? "text-rose-400" : "text-slate-300"} group-hover:translate-x-0.5 transition-transform`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHART + NETWORK ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">

          {/* Bar Chart */}
          <div className="rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">Activity Trend</p>
                <h2 className="mt-1 text-[17px] font-bold text-slate-950">{momentumMonths}-Month Operating Momentum</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={momentumMonths}
                  onChange={(e) => setMomentumMonths(Number(e.target.value) as 3 | 6)}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e293b] inline-block" />Orders</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] inline-block" />Invoices</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#10b981] inline-block" />Delivered</span>
                </div>
              </div>
            </div>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                  <Tooltip
                    cursor={{ fill: "rgba(248,250,255,0.8)", rx: 8 }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  />
                  <Bar dataKey="orders"    fill="#1e293b" radius={[5,5,0,0]} maxBarSize={28} />
                  <Bar dataKey="invoices"  fill="#3b82f6" radius={[5,5,0,0]} maxBarSize={28} />
                  <Bar dataKey="deliveries" fill="#10b981" radius={[5,5,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Network */}
          <div className="rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">Network Coverage</p>
            <h2 className="mt-1 text-[17px] font-bold text-slate-950 mb-5">Business Entities</h2>
            <div className="space-y-3">
              {[
                {
                  label: "Clients",
                  value: data.clients.length,
                  sub: `${data.clients.filter((c) => c.isActive !== false).length} active`,
                  icon: <Users size={16} />,
                  color: "bg-slate-900 text-white",
                  dest: "/clients/dashboard",
                },
                {
                  label: "Companies",
                  value: data.companies.length,
                  sub: `${data.companies.filter((c) => c.isActive).length} active exporters`,
                  icon: <Building2 size={16} />,
                  color: "bg-slate-900 text-white",
                  dest: "/companies/dashboard",
                },
                {
                  label: "Dealers",
                  value: data.dealers.length,
                  sub: `${data.dealers.filter((d) => d.gstNumber).length} GST registered`,
                  icon: <Store size={16} />,
                  color: "bg-slate-900 text-white",
                  dest: "/dealers/dashboard",
                },
                {
                  label: "Team Members",
                  value: data.users.length,
                  sub: isAdmin ? `${data.users.filter((u) => u.role === "admin").length} admins` : "Admin view only",
                  icon: <ShieldCheck size={16} />,
                  color: "bg-slate-900 text-white",
                  dest: isAdmin ? "/user-management" : "/profile",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.dest)}
                  className="w-full flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>{item.icon}</div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-bold text-slate-950">{item.value}</span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RECENT ACTIVITY ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Recent PIs */}
          <RecentCard
            title="Recent PI Activity"
            sub="Latest documentation flow"
            actionLabel="View all"
            onAction={() => navigate("/proforma-invoice/list")}
          >
            {recentPIs.length === 0 ? (
              <EmptyState text="No proforma invoices yet" />
            ) : recentPIs.map((pi) => (
              <div key={pi._id} className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0 group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{pi.piNumber}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{pi.client_id?.name || pi.clientSnapshot?.name || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-1 ${
                    pi.status === "lc_received" ? "bg-emerald-50 text-emerald-700" :
                    pi.status === "sent_to_buyer" ? "bg-blue-50 text-blue-700" :
                    pi.status === "expired" ? "bg-rose-50 text-rose-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {pi.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{fmtCurrency(Number(pi.totalAmount || 0))}</p>
                </div>
              </div>
            ))}
          </RecentCard>

          {/* Recent Bookings */}
          <RecentCard
            title="Recent Vehicle Movement"
            sub="Latest sourcing signals"
            actionLabel="View all"
            onAction={() => navigate("/vehicles/orders")}
          >
            {recentBookings.length === 0 ? (
              <EmptyState text="No vehicle bookings yet" />
            ) : recentBookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0 group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{getVehicleName(b)}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {b.assignedClientSnapshot?.name || b.assignedDealerSnapshot?.name || "Unassigned"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-1 ${
                    b.status === "delivered" ? "bg-emerald-50 text-emerald-700" :
                    b.status === "chassis_received" ? "bg-indigo-50 text-indigo-700" :
                    b.status === "payment_done" ? "bg-blue-50 text-blue-700" :
                    b.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    b.status === "rejected" ? "bg-rose-50 text-rose-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {b.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{fmtDate(b.updatedAt || b.createdAt)}</p>
                </div>
              </div>
            ))}
          </RecentCard>
        </div>

        {/* ── QUICK NAV TILES ─────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Clients & Orders",    desc: "Client relationships and intake",      icon: <Users size={18} />,      dest: "/clients/dashboard",            iconBg: "bg-slate-900 text-white" },
            { title: "Vehicle Sourcing",    desc: "Bookings, inventory, and dispatch",    icon: <CarFront size={18} />,   dest: "/vehicles/dashboard",           iconBg: "bg-slate-900 text-white" },
            { title: "Documentation",       desc: "PI creation, approvals, and LC",       icon: <FileText size={18} />,   dest: "/proforma-invoice/dashboard",   iconBg: "bg-slate-900 text-white" },
            { title: "Counterparties",      desc: "Companies, dealers, governance",       icon: <Landmark size={18} />,   dest: "/companies/dashboard",          iconBg: "bg-slate-900 text-white" },
          ].map((tile) => (
            <button
              key={tile.title}
              onClick={() => navigate(tile.dest)}
              className="group relative overflow-hidden rounded-[20px] border border-slate-100 bg-white p-5 text-left shadow-[0_1px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_32px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-4 ${tile.iconBg}`}>
                {tile.icon}
              </div>
              <p className="text-[14px] font-bold text-slate-900">{tile.title}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{tile.desc}</p>
              <ArrowUpRight size={16} className="absolute top-4 right-4 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

// ── SUB-COMPONENTS ────────────────────────────────────────

const FlowCard = ({
  title, subtitle, accentColor, rows, action, navigate,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  rows: Array<{ label: string; value: number; total: number; color: string }>;
  action: { label: string; dest: string };
  navigate: (path: string) => void;
}) => (
  <div className="rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-6">
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="w-10 h-1 rounded-full mb-3" style={{ backgroundColor: accentColor }} />
        <h2 className="text-[17px] font-bold text-slate-950">{title}</h2>
        <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>
      </div>
      <button
        onClick={() => navigate(action.dest)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        {action.label}
        <ArrowRight size={12} />
      </button>
    </div>
    <div className="space-y-3.5">
      {rows.map((row) => {
        const pct = row.total > 0 ? Math.max((row.value / row.total) * 100, row.value > 0 ? 4 : 0) : 0;
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-slate-600">{row.label}</span>
              <span className="text-[13px] font-bold text-slate-900">{row.value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const RecentCard = ({
  title, sub, actionLabel, onAction, children,
}: {
  title: string;
  sub: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) => (
  <div className="rounded-[20px] bg-white border border-slate-100 shadow-[0_1px_8px_rgba(15,23,42,0.04)] p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-950">{title}</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
      <button
        onClick={onAction}
        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
      >
        {actionLabel}
      </button>
    </div>
    <div>{children}</div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-[12px] text-slate-400">
    {text}
  </div>
);

export default Dashboard;