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
} from "lucide-react";
import api from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";

/* ─────────────────────── types ──────────────────────────── */
type VehicleBookingStatus =
  | "pending" | "quotation_details_pending" | "quotation_uploaded" | "approved"
  | "rejected" | "payment_done" | "chassis_received" | "delivered";
type PIStatus =
  | "draft" | "pending_approval" | "approved"
  | "sent_to_buyer" | "lc_received" | "expired";

interface ClientItem   { _id: string; name: string; isActive?: boolean; address?: { country?: string } }
interface CompanyItem  { _id: string; name: string; isActive?: boolean; address?: { country?: string } }
interface DealerItem   { _id: string; name: string; gstNumber?: string }
interface ExportOrderItem { _id: string; orderId: string; date?: string; createdAt?: string; status: string; vehicles?: Array<{ quantity?: number }> }
interface VehicleBookingItem {
  _id: string; status: VehicleBookingStatus;
  createdAt?: string; updatedAt?: string; deliveryDate?: string;
  engineNumber?: string; chassisNumber?: string;
  assignedClientId?: string; assignedDealerId?: string;
  assignedClientSnapshot?: { name?: string }; assignedDealerSnapshot?: { name?: string };
  isCRTMUploaded?: boolean; isBVUploaded?: boolean; isDealerInvoiceUploaded?: boolean;
  orderId?: string | { orderNumber?: string; vehicleSnapshot?: { brandName?: string; modelName?: string } };
}
interface ProformaInvoiceItem {
  _id: string; piNumber: string; status: PIStatus;
  totalAmount?: number; validityDate?: string; createdAt?: string;
  client_id?: { name?: string }; clientSnapshot?: { name?: string };
}
interface UserItem { _id: string; name: string; role: string }
interface DashboardCollections {
  clients: ClientItem[]; companies: CompanyItem[]; dealers: DealerItem[];
  vehicleBookings: VehicleBookingItem[]; proformaInvoices: ProformaInvoiceItem[];
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

const EMPTY: DashboardCollections = { clients: [], companies: [], dealers: [], vehicleBookings: [], proformaInvoices: [], users: [] };

const BOOKING_FLOW: Array<{ status: VehicleBookingStatus; label: string; color: string }> = [
  { status: "pending",            label: "Quotation Pending", color: "#93c5fd" },
  { status: "quotation_details_pending", label: "Costing Pending", color: "#60a5fa" },
  { status: "quotation_uploaded", label: "Waiting for Approval", color: "#fbbf24" },
  { status: "approved",           label: "Approved",          color: "#34d399" },
  { status: "rejected",           label: "Rejected",          color: "#f87171" },
  { status: "payment_done",       label: "Awaiting Numbers",  color: "#60a5fa" },
  { status: "chassis_received",   label: "In Transit",        color: "#a78bfa" },
  { status: "delivered",          label: "Delivered",         color: "#4ade80" },
];
const PI_FLOW: Array<{ status: PIStatus; label: string; color: string }> = [
  { status: "draft",            label: "Draft",            color: "#93c5fd" },
  { status: "pending_approval", label: "Pending Approval", color: "#fbbf24" },
  { status: "approved",         label: "Approved",         color: "#34d399" },
  { status: "sent_to_buyer",    label: "Sent to Client",    color: "#60a5fa" },
  { status: "lc_received",      label: "LC Received",      color: "#a78bfa" },
  { status: "expired",          label: "Expired",          color: "#f87171" },
];

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
const readCollection = <T,>(p: any): T[] => Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
const fmtCurrency = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(1)}K` : `$${Math.round(v).toLocaleString()}`;
const fmtDate = (v?: string) => !v ? "—" : new Date(v).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const daysUntil = (v?: string) => v ? Math.ceil((new Date(v).getTime() - Date.now()) / 86_400_000) : null;
const getVehicleName = (b: VehicleBookingItem) => {
  const oid = b.orderId as any;
  if (oid && typeof oid === "object") {
    const n = `${oid.vehicleSnapshot?.brandName || ""} ${oid.vehicleSnapshot?.modelName || ""}`.trim();
    return n || oid.orderNumber || "Vehicle";
  }
  return "Vehicle";
};
const formatClientAddress = (address?: ClientDashboardProfile["client"]["address"]) =>
  [
    address?.houseBuilding,
    address?.streetArea,
    address?.cityTown,
    address?.state,
    address?.pincode,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ");
const toUpperDisplay = (value?: string | null) =>
  value && value.trim() ? value.toUpperCase() : "—";
const toLowerDisplay = (value?: string | null) =>
  value && value.trim() ? value.toLowerCase() : "—";

/* ─── Animated counter ───────────────────────────────────── */
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = "", suffix = "" }) => {
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
    return () => { if (raf.current) cancelAnimationFrame(raf.current); startRef.current = null; };
  }, [value]); // eslint-disable-line
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};

/* ─── Status pill ────────────────────────────────────────── */
const piStatusCls = (s: PIStatus) => ({ draft: "bg-slate-50 text-slate-600 border-slate-200", pending_approval: "bg-amber-50 text-amber-700 border-amber-200", approved: "bg-emerald-50 text-emerald-700 border-emerald-200", sent_to_buyer: "bg-blue-50 text-blue-700 border-blue-200", lc_received: "bg-indigo-50 text-indigo-700 border-indigo-200", expired: "bg-rose-50 text-rose-700 border-rose-200" }[s] ?? "bg-slate-50 text-slate-500 border-slate-200");
const bookingStatusCls = (s: VehicleBookingStatus) => ({ pending: "bg-slate-50 text-slate-600 border-slate-200", quotation_details_pending: "bg-blue-50 text-blue-700 border-blue-200", quotation_uploaded: "bg-amber-50 text-amber-700 border-amber-200", approved: "bg-emerald-50 text-emerald-700 border-emerald-200", rejected: "bg-rose-50 text-rose-700 border-rose-200", payment_done: "bg-blue-50 text-blue-700 border-blue-200", chassis_received: "bg-indigo-50 text-indigo-700 border-indigo-200", delivered: "bg-green-50 text-green-700 border-green-200" }[s] ?? "bg-slate-50 text-slate-500 border-slate-200");

/* ─── Floating particle canvas ────────────────────────────── */
const ParticleCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w; canvas.height = h;
    const resize = () => { w = canvas.offsetWidth; h = canvas.offsetHeight; canvas.width = w; canvas.height = h; };
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
    }));
    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
      });
      // draw faint connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.06 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

/* ─── Custom Pie label ───────────────────────────────────── */
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontWeight: 700 }}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

/* ═══════════════════════ Dashboard ════════════════════════ */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isClient, user } = useAuth();
  const [data, setData]     = useState<DashboardCollections>(EMPTY);
  const [clientProfile, setClientProfile] = useState<ClientDashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [momentumMonths, setMomentumMonths] = useState<3 | 6>(6);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      if (isClient) {
        try {
          const response = await api.get("/clients/me");
          if (!alive) return;
          setClientProfile(response.data);
          setPartialError(null);
        } catch (error: any) {
          if (!alive) return;
          setPartialError(
            error.response?.data?.message || "Unable to load client dashboard.",
          );
        } finally {
          if (!alive) return;
          setLoading(false);
          setTimeout(() => setMounted(true), 60);
        }
        return;
      }

      const reqs = [
        { key: "clients",          req: api.get("/clients",           { params: { page: 1, limit: 2000 } }) },
        { key: "companies",        req: api.get("/companies",         { params: { page: 1, limit: 2000, status: "all" } }) },
        { key: "dealers",          req: api.get("/dealers",           { params: { page: 1, limit: 2000 } }) },
        { key: "vehicleBookings",  req: api.get("/vehicle-bookings",  { params: { page: 1, limit: 2000 } }) },
        { key: "proformaInvoices", req: api.get("/proforma-invoices", { params: { page: 1, limit: 2000, status: "all" } }) },
        ...(isAdmin ? [{ key: "users", req: api.get("/users") }] : []),
      ];
      const results = await Promise.allSettled(reqs.map((r) => r.req));
      if (!alive) return;
      const next = { ...EMPTY } as any;
      let failed = 0;
      results.forEach((res, i) => {
        if (res.status === "fulfilled") next[reqs[i].key] = readCollection<any>(res.value.data);
        else failed++;
      });
      setData(next);
      setPartialError(failed > 0 ? `${failed} of ${reqs.length} sources temporarily unavailable.` : null);
      setLoading(false);
      setTimeout(() => setMounted(true), 60);
    })();
    return () => { alive = false; };
  }, [isAdmin, isClient]);

  const clientStats = useMemo(() => {
    const orders = clientProfile?.vehicleOrders || [];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return {
      total: clientProfile?.totalVehicleOrders || 0,
      delivered: orders.filter((item) => item.status === "delivered").length,
      inTransit: orders.filter((item) =>
        ["approved", "payment_done", "chassis_received"].includes(item.status),
      ).length,
      documentationPending: orders.filter(
        (item) =>
          !item.isCRTMUploaded ||
          !item.isBVUploaded ||
          !item.isDealerInvoiceUploaded,
      ).length,
      pendingOrders: orders.filter((item) => item.status !== "delivered").length,
      shippedTillToday: orders.filter((item) => {
        if (item.status !== "delivered") return false;
        if (!item.deliveryDate) return false;
        const d = new Date(item.deliveryDate);
        return d >= startOfToday && d <= endOfToday;
      }).length,

      // NOTE: /clients/me currently doesn't return PI/LC lists.
      // Keep these dynamic placeholders for future backend support.
      piPending: 0,
      lcPending: 0,
    };
  }, [clientProfile]);

  const m = useMemo(() => {
    const activePiStatuses: PIStatus[] = ["pending_approval", "approved", "sent_to_buyer"];
    const delivered        = data.vehicleBookings.filter((b) => b.status === "delivered").length;
    const pipelineValue    = data.proformaInvoices.filter((p) => activePiStatuses.includes(p.status)).reduce((t, p) => t + Number(p.totalAmount || 0), 0);
    const awaitingLc       = data.proformaInvoices.filter((p) => p.status === "sent_to_buyer" || p.status === "approved").length;
    const expiringPi       = data.proformaInvoices.filter((p) => { const d = daysUntil(p.validityDate); return d !== null && d >= 0 && d <= 7 && !["lc_received","expired"].includes(p.status); }).length;
    const awaitingNumbers  = data.vehicleBookings.filter((b) => b.status === "payment_done" && (!b.engineNumber || !b.chassisNumber)).length;
    const missingDealer    = data.vehicleBookings.filter((b) => !b.assignedDealerId).length;
    const missingClient    = data.vehicleBookings.filter((b) => !b.assignedClientId).length;
    const docBacklog       = data.vehicleBookings.filter((b) => (b.status === "chassis_received" || b.status === "delivered") && (!b.isCRTMUploaded || !b.isBVUploaded || !b.isDealerInvoiceUploaded)).length;
    const countries        = new Set([...data.clients.map((c) => c.address?.country), ...data.companies.map((c) => c.address?.country)].filter(Boolean)).size;
    const deliveryCompletion = data.vehicleBookings.length > 0 ? Math.round((delivered / data.vehicleBookings.length) * 100) : 0;
    const lcCompletion     = data.proformaInvoices.length > 0 ? Math.round((data.proformaInvoices.filter((p) => p.status === "lc_received").length / data.proformaInvoices.length) * 100) : 0;
    const inFlight         = data.vehicleBookings.filter((b) => ["approved", "payment_done", "chassis_received"].includes(b.status)).length;
    return { delivered, pipelineValue, awaitingLc, expiringPi, awaitingNumbers, missingDealer, missingClient, docBacklog, countries, deliveryCompletion, lcCompletion, inFlight };
  }, [data]);

  const bookingCounts = useMemo(() => {
    const c: Record<VehicleBookingStatus, number> = { pending: 0, quotation_details_pending: 0, quotation_uploaded: 0, approved: 0, rejected: 0, payment_done: 0, chassis_received: 0, delivered: 0 };
    data.vehicleBookings.forEach((b) => { c[b.status]++; });
    return c;
  }, [data.vehicleBookings]);

  const piCounts = useMemo(() => {
    const c: Record<PIStatus, number> = { draft: 0, pending_approval: 0, approved: 0, sent_to_buyer: 0, lc_received: 0, expired: 0 };
    data.proformaInvoices.forEach((p) => { c[p.status]++; });
    return c;
  }, [data.proformaInvoices]);

  const trendData = useMemo(() => {
    const months = Array.from({ length: momentumMonths }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (momentumMonths - 1 - i));
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_FMT.format(d), invoices: 0, deliveries: 0 };
    });
    const map = new Map(months.map((m) => [m.key, m]));
    data.proformaInvoices.forEach((p) => { if (!p.createdAt) return; const d = new Date(p.createdAt); const b = map.get(`${d.getFullYear()}-${d.getMonth()}`); if (b) b.invoices++; });
    data.vehicleBookings.forEach((bk) => { if (bk.status !== "delivered") return; const raw = bk.deliveryDate || bk.updatedAt || bk.createdAt; if (!raw) return; const d = new Date(raw); const b = map.get(`${d.getFullYear()}-${d.getMonth()}`); if (b) b.deliveries++; });
    return months;
  }, [data, momentumMonths]);

  const recentPIs      = useMemo(() => [...data.proformaInvoices].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5), [data.proformaInvoices]);
  const recentBookings = useMemo(() => [...data.vehicleBookings].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()).slice(0, 5), [data.vehicleBookings]);

  const bookingPieData  = useMemo(() => BOOKING_FLOW.map((f) => ({ name: f.label, value: bookingCounts[f.status] || 0, color: f.color })).filter((d) => d.value > 0), [bookingCounts]);
  const piPieData       = useMemo(() => PI_FLOW.map((f) => ({ name: f.label, value: piCounts[f.status] || 0, color: f.color })).filter((d) => d.value > 0), [piCounts]);

  const watchlist = useMemo(() => [
    { label: "Bookings missing dealer",           value: m.missingDealer,   urgent: m.missingDealer > 0,   dest: "/vehicles/orders",       icon: <Store size={13} /> },
    { label: "Bookings missing client",           value: m.missingClient,   urgent: m.missingClient > 0,   dest: "/vehicles/orders",       icon: <Users size={13} /> },
    { label: "Awaiting chassis / engine numbers", value: m.awaitingNumbers, urgent: m.awaitingNumbers > 0, dest: "/vehicles/orders",       icon: <Gauge size={13} /> },
    { label: "PIs expiring within 7 days",        value: m.expiringPi,      urgent: m.expiringPi > 0,      dest: "/proforma-invoice/list", icon: <Clock3 size={13} /> },
    { label: "Documentation backlog",             value: m.docBacklog,      urgent: m.docBacklog > 0,      dest: "/vehicles/orders",       icon: <FileText size={13} /> },
    { label: "PIs awaiting LC from buyer",        value: m.awaitingLc,      urgent: m.awaitingLc > 0,      dest: "/proforma-invoice/list", icon: <FileCheck2 size={13} /> },
  ], [m]);

  const totalAlerts = watchlist.filter((w) => w.urgent).reduce((t, w) => t + w.value, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#eff6ff,#e0f2fe)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-sky-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.75s" }} />
          </div>
          <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.25em]">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  if (isClient) {
    const companyName =
      clientProfile?.client.companyName || user?.name || "CLIENT";
    const addressLabel = formatClientAddress(clientProfile?.client.address);
    const recentOrders = (clientProfile?.vehicleOrders || []).slice(0, 5);

    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f6ff 0%,#f7faff 50%,#eaf3ff 100%)" }}>
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#bfdbfe 1px,transparent 1px)", backgroundSize: "30px 30px", opacity: 0.28 }} />
        <div className="relative max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.45),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.28),_transparent_30%)]" />
            <div className="absolute inset-0 opacity-70">
              <ParticleCanvas />
            </div>
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-200">
                CLIENT DASHBOARD
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight uppercase">
                WELCOME {companyName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-blue-100 uppercase tracking-[0.12em]">
                THIS DASHBOARD ONLY SHOWS INFORMATION RELATED TO YOUR COMPANY ACCOUNT.
              </p>
            </div>
          </div>

          {partialError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 uppercase">
              {partialError}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">COMPANY SNAPSHOT</p>
              <h2 className="text-[18px] font-bold text-slate-900 uppercase">YOUR DETAILS</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard label="NAME" value={toUpperDisplay(clientProfile?.client.name || user?.name)} />
                <InfoCard label="COMPANY NAME" value={toUpperDisplay(clientProfile?.client.companyName)} />
                <InfoCard label="MOBILE NUMBER" value={toUpperDisplay(clientProfile?.client.phone || user?.phone)} />
                <InfoCard label="MAIL ID" value={toLowerDisplay(clientProfile?.client.email || user?.email)} />
                <InfoCard label="COMPANY ADDRESS" value={toUpperDisplay(addressLabel)} wide />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">OVERVIEW</p>
              <h2 className="text-[18px] font-bold text-slate-900 uppercase">RELATED ACTIVITY</h2>
              <div className="mt-5 space-y-3">
                <MetricRow label="TOTAL VEHICLE ORDERS" value={clientStats.total} />
                <MetricRow label="DELIVERED VEHICLES" value={clientStats.delivered} />
                <MetricRow label="IN PROGRESS" value={clientStats.inTransit} />
                <MetricRow label="PENDING ORDERS" value={clientStats.pendingOrders} />

                <MetricRow label="PI PENDING" value={clientStats.piPending} />
                <MetricRow label="LC PENDING" value={clientStats.lcPending} />

                <MetricRow label="DOCS PENDING" value={clientStats.documentationPending} />
                <MetricRow label="SHIPPED TILL TODAY" value={clientStats.shippedTillToday} />

                <MetricRow
                  label="LAST BOOKING"
                  value={clientProfile?.lastBooking ? fmtDate(clientProfile.lastBooking).toUpperCase() : "—"}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">RECENT</p>
                <h2 className="text-[18px] font-bold text-slate-900 uppercase">YOUR RECENT VEHICLE ORDERS</h2>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors uppercase"
              >
                VIEW PROFILE
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState text="NO CLIENT-LINKED VEHICLE ORDERS FOUND YET" />
            ) : (
              <div className="space-y-2.5">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-col gap-3 rounded-xl border border-blue-50 bg-blue-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate uppercase">
                        {getVehicleName(order)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-1 uppercase">
                        {order.assignedDealerSnapshot?.name || "DEALER NOT ASSIGNED YET"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 border uppercase ${bookingStatusCls(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 uppercase">
                        {fmtDate(order.updatedAt || order.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#f0f6ff 0%,#f7faff 50%,#eaf3ff 100%)" }}>
      {/* Subtle dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#bfdbfe 1px,transparent 1px)", backgroundSize: "30px 30px", opacity: 0.28 }} />

      <div
        className="relative max-w-[1600px] mx-auto px-6 py-8 space-y-6"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
      >

        {/* ════════════════════════════════════════
            PREMIUM HERO
        ════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #0f2d6e 0%, #1648b8 30%, #1e6fcc 58%, #0e4fa8 80%, #0a3580 100%)",
            boxShadow: "0 24px 80px -12px rgba(14,45,110,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
            minHeight: 260,
          }}>

          {/* Particle canvas */}
          <ParticleCanvas />

          {/* Big radial glow left */}
          <div className="pointer-events-none absolute -left-32 -top-32 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,179,237,0.18) 0%, transparent 65%)" }} />
          {/* Right glow */}
          <div className="pointer-events-none absolute -right-24 -bottom-24 w-[420px] h-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(129,140,248,0.22) 0%, transparent 65%)" }} />
          {/* Top shimmer */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.35) 40%,rgba(255,255,255,0.35) 60%,transparent 100%)" }} />
          {/* Bottom shimmer */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />

          {/* Glassy inner card for KPIs */}
          <div className="relative px-8 py-9">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

              {/* ── Left copy ── */}
              <div className="max-w-lg">
                {/* Live badge */}
                <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-5"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.85)" }}>Live Operations</span>
                </div>

                <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white mb-3">
                  Vehicle Export<br />
                  <span style={{ background: "linear-gradient(90deg,#93c5fd,#c7d2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Command Center
                  </span>
                </h1>
                <p className="text-[14px] leading-relaxed max-w-xs" style={{ color: "rgba(186,230,253,0.8)" }}>
                  Real-time visibility across sourcing, documentation &amp; dispatch.
                </p>

                {/* Inline mini stats row */}
                <div className="flex items-center gap-5 mt-6">
                  {[
                    { val: data.vehicleBookings.length, label: "Bookings" },
                    { val: data.proformaInvoices.length, label: "Invoices" },
                    { val: m.inFlight, label: "In Transit" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[22px] font-bold text-white tabular-nums leading-none"><AnimatedNumber value={s.val} /></p>
                      <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-[0.15em]" style={{ color: "rgba(147,197,253,0.75)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {partialError && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12px]"
                    style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.28)", color: "#fde68a" }}>
                    <AlertTriangle size={13} /> {partialError}
                  </div>
                )}
              </div>

              {/* ── Right KPI cards ── */}
              <div className="grid grid-cols-2 xl:grid-cols-2 gap-3 xl:min-w-[460px]">
                {[
                  {
                    label: "Pipeline Value",
                    value: fmtCurrency(m.pipelineValue),
                    sub: `${data.proformaInvoices.length} PI documents`,
                    icon: <FileCheck2 size={17} />,
                    glow: "rgba(96,165,250,0.25)",
                    accent: "#60a5fa",
                  },
                  {
                    label: "Delivery Rate",
                    value: `${m.deliveryCompletion}%`,
                    sub: `${m.delivered} of ${data.vehicleBookings.length} units`,
                    icon: <Truck size={17} />,
                    glow: "rgba(52,211,153,0.2)",
                    accent: "#34d399",
                  },
                  {
                    label: "LC Completion",
                    value: `${m.lcCompletion}%`,
                    sub: "proforma invoices closed",
                    icon: <PackageCheck size={17} />,
                    glow: "rgba(167,139,250,0.2)",
                    accent: "#a78bfa",
                  },
                  {
                    label: "Countries",
                    value: String(m.countries),
                    sub: "global network footprint",
                    icon: <Globe2 size={17} />,
                    glow: "rgba(251,191,36,0.18)",
                    accent: "#fbbf24",
                  },
                ].map((kpi) => (
                  <div key={kpi.label}
                    className="relative rounded-2xl p-4 overflow-hidden group transition-all duration-300 hover:scale-[1.03]"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}>
                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${kpi.glow}, transparent 70%)` }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(186,230,253,0.75)" }}>{kpi.label}</p>
                        <div className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.12)", color: kpi.accent }}>{kpi.icon}</div>
                      </div>
                      <p className="text-[26px] font-bold text-white tracking-tight tabular-nums leading-none mb-1">{kpi.value}</p>
                      <p className="text-[11px]" style={{ color: "rgba(186,230,253,0.65)" }}>{kpi.sub}</p>
                      {/* Bottom accent line */}
                      <div className="mt-3 h-0.5 rounded-full opacity-50" style={{ background: `linear-gradient(90deg,${kpi.accent},transparent)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            KPI SUMMARY ROW
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { label: "Business Network",  num: data.clients.length + data.companies.length + data.dealers.length, detail: `${data.clients.length} clients · ${data.companies.length} cos · ${data.dealers.length} dealers`, icon: <Building2 size={18} />, dest: "/clients/dashboard",          g: ["#2563eb","#1d4ed8"], light: "#eff6ff" },
            { label: "Vehicle Bookings",  num: data.vehicleBookings.length,  detail: `${m.inFlight} in active sourcing & transit`,    icon: <CarFront size={18} />,   dest: "/vehicles/dashboard",         g: ["#6366f1","#4f46e5"], light: "#eef2ff" },
            { label: "Proforma Invoices", num: data.proformaInvoices.length, detail: `${m.awaitingLc} PIs awaiting buyer LC`,         icon: <FileCheck2 size={18} />, dest: "/proforma-invoice/dashboard", g: ["#0284c7","#0369a1"], light: "#e0f2fe" },
            
          ].map((card) => (
            <button key={card.label} onClick={() => navigate(card.dest)}
              className="group text-left rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
              style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(37,99,235,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 16px rgba(37,99,235,0.07)")}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200"
                  style={{ background: `linear-gradient(135deg,${card.g[0]},${card.g[1]})` }}>
                  {card.icon}
                </div>
                <ArrowUpRight size={14} className="text-blue-200 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
              <p className="text-[30px] font-bold text-slate-900 tracking-tight leading-none tabular-nums mb-1.5">
                <AnimatedNumber value={card.num} />
              </p>
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.13em] mb-0.5">{card.label}</p>
              <p className="text-[12px] text-slate-400">{card.detail}</p>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            FLOW PANELS + WATCHLIST
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_360px] gap-5">

          {/* Vehicle Booking Flow */}
          <FlowCard
            title="Vehicle Booking Flow"
            subtitle="Unit-wise execution pipeline"
            accentColors={["#2563eb","#6366f1"]}
            rows={BOOKING_FLOW.map((f) => ({ label: f.label, value: bookingCounts[f.status] || 0, total: data.vehicleBookings.length, color: f.color }))}
            action={{ label: "View all", dest: "/vehicles/orders" }}
            navigate={navigate}
          />

          {/* PI Flow */}
          <FlowCard
            title="PI & Payment Flow"
            subtitle="Documentation pipeline status"
            accentColors={["#0ea5e9","#2563eb"]}
            rows={PI_FLOW.map((f) => ({ label: f.label, value: piCounts[f.status] || 0, total: data.proformaInvoices.length, color: f.color }))}
            action={{ label: "View all", dest: "/proforma-invoice/list" }}
            navigate={navigate}
          />

          {/* Watchlist */}
          <div className="rounded-2xl bg-white flex flex-col overflow-hidden"
            style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-blue-50">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Action Required</p>
                <h2 className="mt-0.5 text-[16px] font-bold text-slate-900">Watchlist</h2>
              </div>
              {totalAlerts > 0 && (
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-white"
                  style={{ background: "linear-gradient(135deg,#f43f5e,#e11d48)", boxShadow: "0 4px 14px rgba(244,63,94,0.35)" }}>
                  <Zap size={11} />
                  <span className="text-[11px] font-bold">{totalAlerts}</span>
                </div>
              )}
            </div>
            <div className="p-3 space-y-1.5 flex-1">
              {watchlist.map((w) => (
                <button key={w.label} onClick={() => navigate(w.dest)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left group transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: w.urgent ? "rgba(255,241,242,0.9)" : "rgba(239,246,255,0.7)",
                    border: w.urgent ? "1px solid rgba(254,202,202,0.7)" : "1px solid rgba(191,219,254,0.55)",
                    boxShadow: w.urgent ? "0 1px 4px rgba(244,63,94,0.06)" : "none",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = w.urgent ? "rgba(254,226,226,0.95)" : "rgba(219,234,254,0.65)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = w.urgent ? "rgba(255,241,242,0.9)" : "rgba(239,246,255,0.7)"; }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`shrink-0 p-1.5 rounded-lg ${w.urgent ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-blue-500"}`}>{w.icon}</div>
                    <p className={`text-[12px] font-medium truncate ${w.urgent ? "text-rose-700" : "text-slate-600"}`}>{w.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[14px] font-bold tabular-nums ${w.urgent ? "text-rose-500" : "text-emerald-500"}`}>{w.value}</span>
                    <ChevronRight size={12} className={`${w.urgent ? "text-rose-300" : "text-blue-200"} group-hover:translate-x-0.5 transition-transform`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            PIE CHARTS ROW
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Booking Status Donut */}
          <PieCard
            title="Booking Status Breakdown"
            subtitle="Distribution across all vehicle bookings"
            total={data.vehicleBookings.length}
            pieData={bookingPieData}
            legend={BOOKING_FLOW.map((f) => ({ label: f.label, value: bookingCounts[f.status] || 0, color: f.color }))}
          />

          {/* PI Status Donut */}
          <PieCard
            title="PI Status Breakdown"
            subtitle="Distribution across all proforma invoices"
            total={data.proformaInvoices.length}
            pieData={piPieData}
            legend={PI_FLOW.map((f) => ({ label: f.label, value: piCounts[f.status] || 0, color: f.color }))}
          />
        </div>

        {/* ════════════════════════════════════════
            AREA CHART + ENTITIES
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5">

          {/* Area chart */}
          <div className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-0.5">Activity Trend</p>
                <h2 className="text-[17px] font-bold text-slate-900">{momentumMonths}-Month Momentum</h2>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }} />Invoices</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }} />Delivered</span>
                </div>
                <select value={momentumMonths} onChange={(e) => setMomentumMonths(Number(e.target.value) as 3 | 6)}
                  className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:bg-blue-100 transition-colors">
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>
            </div>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#dbeafe" vertical={false} />
                  <XAxis dataKey="label" stroke="#93c5fd" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
                  <YAxis stroke="#93c5fd" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} width={26} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: "1px solid #bfdbfe", boxShadow: "0 12px 40px rgba(37,99,235,0.12)", fontSize: 12, fontWeight: 600, background: "#fff" }}
                    cursor={{ stroke: "#93c5fd", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area type="monotone" dataKey="invoices"  stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradInv)" dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#2563eb" }} name="Invoices" />
                  <Area type="monotone" dataKey="deliveries" stroke="#10b981" strokeWidth={2.5} fill="url(#gradDel)" dot={{ r: 3.5, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#059669" }} name="Delivered" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Entities */}
          <div className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-0.5">Coverage</p>
            <h2 className="text-[17px] font-bold text-slate-900 mb-5">Business Entities</h2>
            <div className="space-y-2.5">
              {[
                { label: "Clients",      value: data.clients.length,   sub: `${data.clients.filter((c) => c.isActive !== false).length} active`,            icon: <Users size={15} />,     dest: "/clients/dashboard",   g: ["#2563eb","#1d4ed8"] },
                { label: "Companies",    value: data.companies.length,  sub: `${data.companies.filter((c) => c.isActive).length} active exporters`,         icon: <Building2 size={15} />, dest: "/companies/dashboard", g: ["#6366f1","#4f46e5"] },
                { label: "Dealers",      value: data.dealers.length,    sub: `${data.dealers.filter((d) => d.gstNumber).length} GST registered`,            icon: <Store size={15} />,     dest: "/dealers/dashboard",   g: ["#0284c7","#0369a1"] },
                { label: "Team Members", value: data.users.length,      sub: isAdmin ? `${data.users.filter((u) => u.role === "admin").length} admins` : "Admin view only", icon: <ShieldCheck size={15} />, dest: isAdmin ? "/user-management" : "/profile", g: ["#0891b2","#0e7490"] },
              ].map((item) => (
                <button key={item.label} onClick={() => navigate(item.dest)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 group transition-all duration-200"
                  style={{ background: "rgba(239,246,255,0.6)", border: "1px solid rgba(191,219,254,0.5)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(219,234,254,0.6)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(37,99,235,0.09)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,246,255,0.6)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm group-hover:scale-110 transition-transform duration-200"
                      style={{ background: `linear-gradient(135deg,${item.g[0]},${item.g[1]})` }}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[22px] font-bold text-slate-900 tabular-nums"><AnimatedNumber value={item.value} /></span>
                    <ArrowRight size={13} className="text-blue-200 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RECENT ACTIVITY
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Recent PIs */}
          <div className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Recent PI Activity</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Latest documentation flow</p>
              </div>
              <button onClick={() => navigate("/proforma-invoice/list")}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors">
                View all
              </button>
            </div>
            {recentPIs.length === 0 ? <EmptyState text="No proforma invoices yet" /> : recentPIs.map((pi) => (
              <div key={pi._id} className="flex items-center justify-between gap-3 py-2.5 border-b border-blue-50/70 last:border-0 hover:bg-blue-50/40 -mx-2 px-2 rounded-lg transition-colors cursor-pointer group">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{pi.piNumber}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{pi.client_id?.name || pi.clientSnapshot?.name || "—"}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${piStatusCls(pi.status)}`}>{pi.status.replace(/_/g, " ")}</span>
                  <p className="text-[10px] font-semibold text-blue-500">{fmtCurrency(Number(pi.totalAmount || 0))}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Bookings */}
          <div className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Recent Vehicle Movement</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Latest sourcing signals</p>
              </div>
              <button onClick={() => navigate("/vehicles/orders")}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors">
                View all
              </button>
            </div>
            {recentBookings.length === 0 ? <EmptyState text="No vehicle bookings yet" /> : recentBookings.map((b) => (
              <div key={b._id} className="flex items-center justify-between gap-3 py-2.5 border-b border-blue-50/70 last:border-0 hover:bg-blue-50/40 -mx-2 px-2 rounded-lg transition-colors cursor-pointer group">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{getVehicleName(b)}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.assignedClientSnapshot?.name || b.assignedDealerSnapshot?.name || "Unassigned"}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <span className={`inline-block text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${bookingStatusCls(b.status)}`}>{b.status.replace(/_/g, " ")}</span>
                  <p className="text-[10px] text-slate-400">{fmtDate(b.updatedAt || b.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════
            QUICK NAV
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Clients & Network", desc: "Client relationships and intake",    icon: <Users size={20} />,      dest: "/clients/dashboard",          g: ["#2563eb","#1d4ed8"] },
            { title: "Vehicle Sourcing",  desc: "Bookings, inventory, and dispatch",  icon: <CarFront size={20} />,   dest: "/vehicles/dashboard",         g: ["#6366f1","#4f46e5"] },
            { title: "Documentation",     desc: "PI creation, approvals, and LC",     icon: <FileText size={20} />,   dest: "/proforma-invoice/dashboard", g: ["#0284c7","#0369a1"] },
            { title: "Counterparties",    desc: "Companies, dealers, governance",     icon: <Landmark size={20} />,   dest: "/companies/dashboard",        g: ["#0891b2","#0e7490"] },
          ].map((tile) => (
            <button key={tile.title} onClick={() => navigate(tile.dest)}
              className="cursor-pointer group relative overflow-hidden rounded-2xl bg-white p-5 text-left transition-all duration-300 hover:-translate-y-2 active:scale-[0.98]"
              style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 20px 56px rgba(37,99,235,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 16px rgba(37,99,235,0.07)")}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.06] group-hover:opacity-[0.13] transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle,${tile.g[0]},transparent)` }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-200"
                style={{ background: `linear-gradient(135deg,${tile.g[0]},${tile.g[1]})` }}>
                {tile.icon}
              </div>
              <p className="text-[14px] font-bold text-slate-900 mb-0.5">{tile.title}</p>
              <p className="text-[12px] text-slate-400">{tile.desc}</p>
              <ArrowUpRight size={15} className="absolute top-4 right-4 text-blue-200 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

/* ─── FlowCard ───────────────────────────────────────────── */
const FlowCard: React.FC<{
  title: string; subtitle: string; accentColors: [string, string];
  rows: Array<{ label: string; value: number; total: number; color: string }>;
  action: { label: string; dest: string }; navigate: (p: string) => void;
}> = ({ title, subtitle, accentColors, rows, action, navigate }) => (
  <div className="rounded-2xl bg-white p-6"
    style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="w-8 h-1 rounded-full mb-3" style={{ background: `linear-gradient(90deg,${accentColors[0]},${accentColors[1]})` }} />
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>
      </div>
      <button onClick={() => navigate(action.dest)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
        style={{ border: "1px solid rgba(147,197,253,0.6)" }}>
        {action.label} <ArrowRight size={11} />
      </button>
    </div>
    <div className="space-y-3.5">
      {rows.map((row) => {
        const pct = row.total > 0 ? Math.max((row.value / row.total) * 100, row.value > 0 ? 4 : 0) : 0;
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-slate-600">{row.label}</span>
              <span className="text-[13px] font-bold text-slate-800 tabular-nums">{row.value}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(219,234,254,0.8)" }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(pct, 100)}%`, background: row.color }} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ─── PieCard ────────────────────────────────────────────── */
const PieCard: React.FC<{
  title: string; subtitle: string; total: number;
  pieData: Array<{ name: string; value: number; color: string }>;
  legend: Array<{ label: string; value: number; color: string }>;
}> = ({ title, subtitle, total, pieData, legend }) => (
  <div className="rounded-2xl bg-white p-6"
    style={{ border: "1px solid rgba(147,197,253,0.45)", boxShadow: "0 2px 16px rgba(37,99,235,0.07)" }}>
    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-0.5">Distribution</p>
    <h2 className="text-[16px] font-bold text-slate-900 mb-1">{title}</h2>
    <p className="text-[12px] text-slate-400 mb-5">{subtitle}</p>
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData.length > 0 ? pieData : [{ name: "none", value: 1, color: "#e2e8f0" }]}
              cx="50%" cy="50%" innerRadius={42} outerRadius={68}
              paddingAngle={pieData.length > 1 ? 2 : 0}
              dataKey="value"
              labelLine={false}
              label={pieData.length > 0 ? renderCustomLabel : undefined}>
              {(pieData.length > 0 ? pieData : [{ name: "none", value: 1, color: "#e2e8f0" }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 600, background: "#fff", boxShadow: "0 8px 24px rgba(37,99,235,0.1)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-none">{total}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">total</p>
        </div>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-1.5">
        {legend.filter((l) => l.value > 0).map((l) => (
          <div key={l.label} className="flex items-center justify-between gap-2 group">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
              <p className="text-[11px] font-medium text-slate-600 truncate">{l.label}</p>
            </div>
            <span className="text-[12px] font-bold text-slate-800 tabular-nums flex-shrink-0">{l.value}</span>
          </div>
        ))}
        {legend.every((l) => l.value === 0) && (
          <p className="text-[12px] text-slate-400">No data yet</p>
        )}
      </div>
    </div>
  </div>
);

/* ─── EmptyState ─────────────────────────────────────────── */
const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl py-8 text-center text-[12px] font-medium"
    style={{ border: "1.5px dashed rgba(147,197,253,0.6)", background: "rgba(239,246,255,0.5)", color: "#93c5fd" }}>
    {text}
  </div>
);

const InfoCard = ({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) => (
  <div
    className={`rounded-2xl border border-blue-100 bg-blue-50/60 p-4 ${
      wide ? "sm:col-span-2" : ""
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
      {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-slate-900 break-words">{value}</p>
  </div>
);

const MetricRow = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
    <span className="text-[12px] font-medium text-slate-600">{label}</span>
    <span className="text-[14px] font-bold text-slate-900">{value}</span>
  </div>
);

export default Dashboard;
