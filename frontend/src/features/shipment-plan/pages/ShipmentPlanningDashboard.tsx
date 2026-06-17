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
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

const API_LIMIT_FOR_KPIS = 50;
const RECENT_LIMIT = 8;

type TimeRangeKey = "all" | "thisMonth" | "lastMonth";

const ShipmentPlanningDashboard: React.FC = () => {
  const { isClient } = useAuth();

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
    const total = shipments.length; // Always show all fetched shipments regardless of time range filter
    const destinations = new Set<string>();
    let upcomingArrivals = 0;
    let missingVesselOrLine = 0;


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const s of filteredForInsights) {
      if (s.destinationCountry)
        destinations.add(String(s.destinationCountry).trim());

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

  if (isClient) {
    return <Navigate to="/shipment-planning/list" replace />;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#f8faff] dark:bg-gray-950">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Shipment Dashboard
          </h1>
          <p className="text-[15px] text-slate-500 font-medium mt-1">
            Shipment readiness & vehicle insights.
          </p>
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