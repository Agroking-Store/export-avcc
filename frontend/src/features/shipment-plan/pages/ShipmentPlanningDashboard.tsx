import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Building2,
  Globe,
  Info,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { shipmentApi } from "../../../services/shipmentApi";
import type { ShippingDetail } from "./shipmentData";
import { formatDate } from "./shipmentData";

const API_LIMIT_FOR_KPIS = 50;
const RECENT_LIMIT = 8;

type TimeRangeKey = "all" | "thisMonth" | "lastMonth";

const ShipmentPlanningDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("thisMonth");

  const [shipments, setShipments] = useState<ShippingDetail[]>([]);
  const [recent, setRecent] = useState<ShippingDetail[]>([]);

  const fetchShipments = async () => {
    setSubmitting(true);
    try {
      const result = await shipmentApi.list({
        search: search || undefined,
        page: 1,
        limit: API_LIMIT_FOR_KPIS,
      });

      const list = Array.isArray(result?.data) ? result.data : [];
      setShipments(list);

      // Recent = first N from the sorted API response (backend sorts by createdAt desc)
      setRecent(list.slice(0, RECENT_LIMIT));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load shipments");
      setShipments([]);
      setRecent([]);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filteredForInsights = useMemo(() => {
    if (timeRange === "all") return shipments;

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (timeRange === "thisMonth") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "lastMonth") {
      // last month range
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth());
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return shipments.filter((s) => {
      const d = s.arrivalDate ? new Date(s.arrivalDate) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= start && d <= end;
    });
  }, [shipments, timeRange]);

  const kpis = useMemo(() => {
    const total = filteredForInsights.length;
    const destinations = new Set<string>();
    let upcomingArrivals = 0;
    let missingVesselOrLine = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const s of filteredForInsights) {
      if (s.destinationCountry) destinations.add(String(s.destinationCountry).trim());

      if (s.arrivalDate) {
        const ad = new Date(s.arrivalDate);
        if (!Number.isNaN(ad.getTime())) {
          ad.setHours(0, 0, 0, 0);
          if (ad >= today) upcomingArrivals += 1;
        }
      }

      const vesselOk = !!String(s.vesselName || "").trim();
      const lineOk = !!String(s.shippingLine || "").trim();
      if (!vesselOk || !lineOk) missingVesselOrLine += 1;
    }

    return {
      total,
      destinationsCount: destinations.size,
      upcomingArrivals,
      missingVesselOrLine,
    };
  }, [filteredForInsights]);

  const bgTone = (key: string) => {
    switch (key) {
      case "total":
        return "bg-slate-100 text-slate-800";
      case "dest":
        return "bg-blue-100 text-blue-800";
      case "upcoming":
        return "bg-amber-100 text-amber-800";
      case "missing":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const kpiCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total Shipments",
        value: kpis.total,
        icon: <Package size={16} className="opacity-80" />,
      },
      {
        key: "dest",
        label: "Unique Destinations",
        value: kpis.destinationsCount,
        icon: <Globe size={16} className="opacity-80" />,
      },
      {
        key: "upcoming",
        label: "Upcoming Arrivals",
        value: kpis.upcomingArrivals,
        icon: <Calendar size={16} className="opacity-80" />,
      },
      {
        key: "missing",
        label: "Incomplete (Vessel/Line)",
        value: kpis.missingVesselOrLine,
        icon: <Info size={16} className="opacity-80" />,
      },
    ],
    [kpis],
  );

  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case "thisMonth":
        return "This Month";
      case "lastMonth":
        return "Last Month";
      default:
        return "All";
    }
  }, [timeRange]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#f8faff] dark:bg-gray-950">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Shipment Dashboard
          </h1>
          <p className="text-[15px] text-slate-500 font-medium mt-1">
            Shipment readiness & container readiness insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLoading(true);
              }}
              placeholder="Search shipments..."
              className="pl-10 pr-4 py-2.5 w-72 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
            className="py-2.5 px-4 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiCards.map((card) => (
          <StatCard
            key={card.key}
            title={card.label}
            value={card.value}
            icon={card.icon}
            color={
              card.key === "total"
                ? "bg-blue-50 text-blue-600"
                : card.key === "dest"
                  ? "bg-indigo-50 text-indigo-600"
                  : card.key === "upcoming"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
            }
          />
        ))}

        <div className="hidden lg:block rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
            Filter
          </p>
          <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
            {timeRangeLabel}
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            {RECENT_LIMIT} latest shipments shown.
          </p>
        </div>
      </div>

      {/* DATA SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* RECENT SHIPMENTS */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Truck size={18} className="text-slate-500" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Recent Shipments</h2>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
              Loading shipments...
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
              No shipments found
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((s) => {
                const containersCount = Array.isArray(s.containers)
                  ? s.containers.length
                  : 0;

                const vesselLineMissing =
                  !String(s.vesselName || "").trim() ||
                  !String(s.shippingLine || "").trim();

                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 px-5 py-4 hover:border-blue-100 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {s._id.slice(-6).toUpperCase()} • {s.customerName || "-"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.destinationCountry || "-"}
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <div
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${vesselLineMissing ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}
                      >
                        {vesselLineMissing ? "Incomplete" : "Ready"}
                      </div>
                      <p className="text-xs text-slate-400">
                        Arrival: {formatDate(s.arrivalDate)}
                      </p>
                      <span className="block px-4 py-1.5 rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                        {containersCount} Containers
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500 flex items-start gap-2">
            <Building2 size={14} className="mt-0.5 text-slate-400" />
            <span>KPI cards are computed from live shipment list data.</span>
          </div>
        </div>

        {/* EMPTY SECOND PANEL (for clean look like Clients dashboard) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Globe size={18} className="text-slate-500" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg">Destination Focus</h2>
          </div>

          <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
            Use the search + time range above to analyze destination readiness.
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
    >
      {icon}
    </div>

    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
      {title}
    </p>

    <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
      {value}
    </h3>
  </div>
);

export default ShipmentPlanningDashboard;


