import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  vehicleBookingApi,
  VehicleBookingItem,
  VehicleBookingStatus,
} from "../../../services/vehicleBookingApi";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  DollarSign,
  Wrench,
  Store,
  User,
  ArrowUpRight,
  Package,
  TrendingUp,
  Ban,
} from "lucide-react";

const STATUS_META: Record<
  VehicleBookingStatus,
  { label: string; badge: string; icon: React.ReactNode; section: "pending" | "inprogress" | "completed" }
> = {
  pending: {
    label: "Quotation Pending",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <Clock size={14} />,
    section: "pending",
  },
  quotation_details_pending: {
    label: "Costing Details Pending",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <FileText size={14} />,
    section: "pending",
  },
  quotation_uploaded: {
    label: "Waiting for Approval",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <FileText size={14} />,
    section: "pending",
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 size={14} />,
    section: "inprogress",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: <Ban size={14} />,
    section: "pending",
  },
  payment_done: {
    label: "Awaiting Numbers",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <DollarSign size={14} />,
    section: "inprogress",
  },
  chassis_received: {
    label: "In Transit",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: <Truck size={14} />,
    section: "inprogress",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-green-100 text-green-700 border-green-200",
    icon: <Package size={14} />,
    section: "completed",
  },
};

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [bookings, setBookings] = useState<VehicleBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const hasEngineAndChassis = (booking: VehicleBookingItem) =>
    !!String(booking.engineNumber || "").trim() &&
    !!String(booking.chassisNumber || "").trim();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await vehicleBookingApi.getAllBookings({
          limit: 1000,
          page: 1,
        });
        setBookings(res.data || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) =>
      ["pending", "quotation_details_pending", "quotation_uploaded", "rejected"].includes(b.status)
    ).length;
    const inProgress = bookings.filter((b) =>
      ["approved", "payment_done", "chassis_received"].includes(b.status)
    ).length;
    const completed = bookings.filter((b) => b.status === "delivered").length;

    const pendingQuotations = bookings.filter((b) => b.status === "pending").length;
    const costingPending = bookings.filter((b) => b.status === "quotation_details_pending").length;
    const awaitingApproval = bookings.filter((b) => b.status === "quotation_uploaded").length;
    const awaitingNumbers = bookings.filter(
      (b) => b.status === "payment_done" && (!b.engineNumber || !b.chassisNumber)
    ).length;
    const missingClient = bookings.filter((b) => !b.assignedClientId).length;
    const piPending = bookings.filter(
      (b) => hasEngineAndChassis(b) && !b.piGenerated,
    ).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      pendingQuotations,
      costingPending,
      awaitingApproval,
      awaitingNumbers,
      missingClient,
      piPending,
    };
  }, [bookings]);

  const pendingBookings = useMemo(
    () => bookings.filter((b) => STATUS_META[b.status].section === "pending"),
    [bookings]
  );

  const inProgressBookings = useMemo(
    () => bookings.filter((b) => STATUS_META[b.status].section === "inprogress"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => STATUS_META[b.status].section === "completed"),
    [bookings]
  );

  const piPendingBookings = useMemo(
    () => bookings.filter((b) => hasEngineAndChassis(b) && !b.piGenerated),
    [bookings],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<VehicleBookingStatus, number> = {
      pending: 0,
      quotation_details_pending: 0,
      quotation_uploaded: 0,
      approved: 0,
      rejected: 0,
      payment_done: 0,
      chassis_received: 0,
      delivered: 0,
    };
    bookings.forEach((b) => {
      counts[b.status]++;
    });
    return counts;
  }, [bookings]);

  const getVehicleName = (booking: VehicleBookingItem) => {
    const oid = (booking as any).orderId;
    const snap = typeof oid === "object" && oid !== null ? oid.vehicleSnapshot : null;
    return snap ? `${snap.brandName || ""} ${snap.modelName || ""}`.trim() || "Unknown Vehicle" : "Unknown Vehicle";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vehicle Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {isAdmin ? "Full system overview" : "Your workflow overview"}
            </p>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-800">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Vehicles" value={metrics.total} icon={<Car size={20} />} color="bg-blue-50 text-blue-600" border="border-blue-200" />
        <SummaryCard label="Pending" value={metrics.pending} icon={<Clock size={20} />} color="bg-amber-50 text-amber-600" border="border-amber-200" />
        <SummaryCard label="In Progress" value={metrics.inProgress} icon={<TrendingUp size={20} />} color="bg-indigo-50 text-indigo-600" border="border-indigo-200" />
        <SummaryCard label="Delivered" value={metrics.completed} icon={<CheckCircle2 size={20} />} color="bg-emerald-50 text-emerald-600" border="border-emerald-200" />
      </div>

      {/* Actionable Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard label="Pending Quotations"    value={metrics.pendingQuotations} icon={<FileText size={18} />}    color="text-slate-600" onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "pending"            } })} />
        <ActionCard label="Costing Pending"        value={metrics.costingPending}   icon={<FileText size={18} />}    color="text-blue-600"  onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "quotation_details_pending" } })} />
        <ActionCard label="Waiting for Approval"  value={metrics.awaitingApproval}  icon={<AlertCircle size={18} />} color="text-amber-600" onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "quotation_uploaded" } })} />
        <ActionCard label="Missing Engine/Chassis" value={metrics.awaitingNumbers}   icon={<Wrench size={18} />}      color="text-blue-600"  onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "payment_done"        } })} />
        <ActionCard label="Proforma Invoices Pending" value={metrics.piPending} icon={<FileText size={18} />} color="text-cyan-600" onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "piPending" } })} />
        {isAdmin && (
          <ActionCard label="Missing Client Allotment" value={metrics.missingClient} icon={<User size={18} />}        color="text-rose-600"  onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "missingClient"       } })} />
        )}
      </div>

      {/* Status Distribution Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Status Distribution</h3>
        <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-800">
          {metrics.total > 0 && (
            <>
              <StatusBarSegment count={statusCounts.pending} total={metrics.total} color="bg-slate-400" />
              <StatusBarSegment count={statusCounts.quotation_details_pending} total={metrics.total} color="bg-blue-400" />
              <StatusBarSegment count={statusCounts.quotation_uploaded} total={metrics.total} color="bg-amber-400" />
              <StatusBarSegment count={statusCounts.approved} total={metrics.total} color="bg-emerald-400" />
              <StatusBarSegment count={statusCounts.rejected} total={metrics.total} color="bg-rose-400" />
              <StatusBarSegment count={statusCounts.payment_done} total={metrics.total} color="bg-blue-400" />
              <StatusBarSegment count={statusCounts.chassis_received} total={metrics.total} color="bg-indigo-400" />
              <StatusBarSegment count={statusCounts.delivered} total={metrics.total} color="bg-green-400" />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <LegendDot color="bg-slate-400" label="Quotation Pending" value={statusCounts.pending} />
          <LegendDot color="bg-blue-400" label="Costing Pending" value={statusCounts.quotation_details_pending} />
          <LegendDot color="bg-amber-400" label="Waiting for Approval" value={statusCounts.quotation_uploaded} />
          <LegendDot color="bg-emerald-400" label="Approved" value={statusCounts.approved} />
          <LegendDot color="bg-rose-400" label="Rejected" value={statusCounts.rejected} />
          <LegendDot color="bg-blue-400" label="Awaiting Numbers" value={statusCounts.payment_done} />
          <LegendDot color="bg-indigo-400" label="In Transit" value={statusCounts.chassis_received} />
          <LegendDot color="bg-green-400" label="Delivered" value={statusCounts.delivered} />
        </div>
      </div>

      {/* Status Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatusSection title="Pending" count={pendingBookings.length} icon={<Clock size={18} className="text-amber-600" />} borderColor="border-amber-200" bgColor="bg-amber-50/50">
          {pendingBookings.length === 0 ? (
            <EmptyState message="No pending vehicles" />
          ) : (
            pendingBookings.slice(0, 8).map((booking) => (
              <BookingRow key={booking._id} booking={booking} vehicleName={getVehicleName(booking)} onClick={() => navigate("/vehicles/orders")} />
            ))
          )}
          {pendingBookings.length > 8 && (
            <button onClick={() => navigate("/vehicles/orders")} className="w-full mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 text-center py-2">
              View all {pendingBookings.length} pending
            </button>
          )}
        </StatusSection>

        <StatusSection title="In Progress" count={inProgressBookings.length} icon={<TrendingUp size={18} className="text-indigo-600" />} borderColor="border-indigo-200" bgColor="bg-indigo-50/50">
          {inProgressBookings.length === 0 ? (
            <EmptyState message="No vehicles in progress" />
          ) : (
            inProgressBookings.slice(0, 8).map((booking) => (
              <BookingRow key={booking._id} booking={booking} vehicleName={getVehicleName(booking)} onClick={() => navigate("/vehicles/orders")} />
            ))
          )}
          {inProgressBookings.length > 8 && (
            <button onClick={() => navigate("/vehicles/orders")} className="w-full mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 text-center py-2">
              View all {inProgressBookings.length} in progress
            </button>
          )}
        </StatusSection>

        <StatusSection title="Proforma Invoices Pending" count={piPendingBookings.length} icon={<FileText size={18} className="text-cyan-600" />} borderColor="border-cyan-200" bgColor="bg-cyan-50/50">
          {piPendingBookings.length === 0 ? (
            <EmptyState message="No PI pending vehicles" />
          ) : (
            piPendingBookings.slice(0, 8).map((booking) => (
              <BookingRow key={booking._id} booking={booking} vehicleName={getVehicleName(booking)} onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "piPending" } })} />
            ))
          )}
          {piPendingBookings.length > 8 && (
            <button onClick={() => navigate("/vehicles/orders", { state: { statusFilter: "piPending" } })} className="w-full mt-3 text-xs font-semibold text-cyan-600 hover:text-cyan-700 text-center py-2">
              View all {piPendingBookings.length} PI pending
            </button>
          )}
        </StatusSection>

        <StatusSection title="Completed" count={completedBookings.length} icon={<CheckCircle2 size={18} className="text-emerald-600" />} borderColor="border-emerald-200" bgColor="bg-emerald-50/50">
          {completedBookings.length === 0 ? (
            <EmptyState message="No delivered vehicles" />
          ) : (
            completedBookings.slice(0, 8).map((booking) => (
              <BookingRow key={booking._id} booking={booking} vehicleName={getVehicleName(booking)} onClick={() => navigate("/vehicles/orders")} />
            ))
          )}
          {completedBookings.length > 8 && (
            <button onClick={() => navigate("/vehicles/orders")} className="w-full mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 text-center py-2">
              View all {completedBookings.length} delivered
            </button>
          )}
        </StatusSection>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionTile title="Vehicle List" desc="View and manage all vehicle bookings" icon={<ClipboardListIcon />} onClick={() => navigate("/vehicles/orders")} />
        <QuickActionTile title="Vehicle Database" desc="Browse available vehicle inventory" icon={<Car size={22} />} onClick={() => navigate("/vehicles/list")} />
        {isAdmin && (
          <QuickActionTile title="Add Vehicle Order" desc="Create a new required vehicle order" icon={<PlusIcon />} onClick={() => navigate("/vehicles/orders/add")} />
        )}
      </div>
    </div>
  );
};

/* ---------------- Sub-components ---------------- */

const SummaryCard = ({ label, value, icon, color, border }: { label: string; value: number; icon: React.ReactNode; color: string; border: string }) => (
  <div className={`rounded-2xl border ${border} bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all`}>
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{value}</h3>
  </div>
);

const ActionCard = ({ label, value, icon, color, onClick }: { label: string; value: number; icon: React.ReactNode; color: string; onClick: () => void }) => (
  <button onClick={onClick} className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left w-full cursor-pointer">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-lg font-black text-slate-800 dark:text-white">{value}</span>
    </div>
  </button>
);

const StatusBarSegment = ({ count, total, color }: { count: number; total: number; color: string }) => {
  if (count === 0) return null;
  const pct = (count / total) * 100;
  return <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />;
};

const LegendDot = ({ color, label, value }: { color: string; label: string; value: number }) => (
  <div className="flex items-center gap-1.5 text-xs">
    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-800 font-bold">{value}</span>
  </div>
);

const StatusSection = ({ title, count, icon, borderColor, bgColor, children }: { title: string; count: number; icon: React.ReactNode; borderColor: string; bgColor: string; children: React.ReactNode }) => (
  <div className={`rounded-2xl border ${borderColor} bg-white dark:bg-gray-900 shadow-sm overflow-hidden`}>
    <div className={`px-5 py-4 ${bgColor} border-b ${borderColor} flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      <span className="text-xs font-bold text-slate-500 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-gray-700">
        {count}
      </span>
    </div>
    <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
      {children}
    </div>
  </div>
);

const BookingRow = ({ booking, vehicleName, onClick }: { booking: VehicleBookingItem; vehicleName: string; onClick: () => void }) => {
  const meta = STATUS_META[booking.status];
  return (
    <button onClick={onClick} className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-gray-800 hover:border-blue-200 transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate pr-2">{vehicleName}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badge} flex items-center gap-1 shrink-0`}>
          {meta.icon}
          {meta.label}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
        {booking.assignedDealerSnapshot?.name && (
          <span className="flex items-center gap-1">
            <Store size={10} />
            {booking.assignedDealerSnapshot.name}
          </span>
        )}
        {booking.assignedClientSnapshot?.name && (
          <span className="flex items-center gap-1">
            <User size={10} />
            {booking.assignedClientSnapshot.name}
          </span>
        )}
        {!booking.assignedDealerId && <span className="text-amber-500 font-semibold">No dealer</span>}
        {booking.status === "payment_done" && (!booking.engineNumber || !booking.chassisNumber) && (
          <span className="text-blue-500 font-semibold">Missing #</span>
        )}
      </div>
    </button>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-8 text-center text-slate-400 text-sm italic">{message}</div>
);

const QuickActionTile = ({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="group cursor-pointer relative overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all text-left">
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <ArrowUpRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
    </div>
    <div className="mt-4 relative z-10">
      <h3 className="font-bold text-slate-800 dark:text-gray-100 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{desc}</p>
    </div>
  </button>
);

const ClipboardListIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default Vehicles;
