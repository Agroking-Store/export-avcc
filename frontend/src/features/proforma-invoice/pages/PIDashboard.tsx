import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileBadge2,
  FileText,
  HandCoins,
  LayoutGrid,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { piApi } from "../components/piApi";
import type {
  DashboardMetric,
  PIDashboardOverview,
} from "../components/pi.types";

const TIME_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisYear", label: "This Year" },
  { value: "allTime", label: "All Time" },
];

const PI_STATUS_COLORS = [
  "#0f766e",
  "#f59e0b",
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#ef4444",
];

const STAGE_COLORS: Record<string, string> = {
  awaiting_lc: "bg-amber-400",
  received_lc: "bg-blue-400",
  verified_lc: "bg-emerald-400",
  amendment_lc: "bg-rose-400",
  "Awaiting LC": "bg-amber-400",
  "Received LC": "bg-blue-400",
  "Verified LC": "bg-emerald-400",
  "Amendment LC": "bg-rose-400",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value);

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatTrend = (trend: number | null) => {
  if (trend === null) {
    return "All-time view";
  }

  const sign = trend > 0 ? "+" : "";
  return `${sign}${(trend * 100).toFixed(1)}% vs previous`;
};

const getTrendTone = (metric: string, trend: number | null) => {
  if (trend === null) {
    return "text-slate-500 bg-slate-50 border-slate-200";
  }

  const positiveIsGood = metric !== "amendmentLC";
  const isPositive = trend >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return isGood
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : "text-rose-700 bg-rose-50 border-rose-200";
};

const getPIStatusClass = (status: string) =>
  (
    ({
      draft: "bg-slate-100 text-slate-700",
      pending_approval: "bg-amber-100 text-amber-800",
      approved: "bg-blue-100 text-blue-800",
      sent_to_buyer: "bg-sky-100 text-sky-800",
      lc_received: "bg-teal-100 text-teal-800",
      expired: "bg-rose-100 text-rose-800",
    }) as Record<string, string>
  )[status] || "bg-slate-100 text-slate-700";

const getLCStageClass = (stage: string) =>
  (
    ({
      "Awaiting LC": "bg-amber-50 text-amber-700 border-amber-200",
      "Received LC": "bg-blue-50 text-blue-700 border-blue-200",
    }) as Record<string, string>
  )[stage] || "bg-slate-50 text-slate-600 border-slate-200";

const daysUntil = (date?: string) => {
  if (!date) {
    return null;
  }

  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
};

const SummaryCard = ({
  label,
  value,
  icon,
  color,
  border,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  border: string;
}) => (
  <div
    className={`rounded-2xl border ${border} bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all`}
  >
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}
    >
      {icon}
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
      {label}
    </p>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
      {value}
    </h3>
  </div>
);

const ActionCard = ({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left w-full cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className="text-lg font-black text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  </button>
);

const MetricCard = ({
  title,
  value,
  hint,
  trend,
  metricKey,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  trend: DashboardMetric["trend"];
  metricKey: string;
  icon: ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
          {title}
        </p>
      </div>
      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-2xl font-black text-slate-800 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-gray-400">{hint}</p>
    </div>

    <div
      className={`mt-4 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getTrendTone(
        metricKey,
        trend,
      )}`}
    >
      {formatTrend(trend)}
    </div>
  </div>
);

const StatusBarSegment = ({
  count,
  total,
  color,
}: {
  count: number;
  total: number;
  color: string;
}) => {
  if (count === 0) return null;
  const pct = (count / total) * 100;
  return <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />;
};

const LegendDot = ({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-1.5 text-xs">
    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-800 font-bold">{value}</span>
  </div>
);

const StatusSection = ({
  title,
  count,
  icon,
  borderColor,
  bgColor,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
}) => (
  <div
    className={`rounded-2xl border ${borderColor} bg-white dark:bg-gray-900 shadow-sm overflow-hidden`}
  >
    <div
      className={`px-5 py-4 ${bgColor} border-b ${borderColor} flex items-center justify-between`}
    >
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

const SectionShell = ({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {eyebrow}
    </p>
    <div className="mb-5 mt-2">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-gray-400">{subtitle}</p>
    </div>
    {children}
  </div>
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl bg-slate-200" />
        <div>
          <Skeleton className="h-7 w-48 bg-slate-200" />
          <Skeleton className="mt-1 h-4 w-32 bg-slate-200" />
        </div>
      </div>
      <Skeleton className="h-10 w-48 rounded-xl bg-slate-200" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl bg-slate-200" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl bg-slate-200" />
      ))}
    </div>
  </div>
);

const PIDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("thisMonth");
  const [data, setData] = useState<PIDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await piApi.getDashboardOverview(timeRange);
        if (active) {
          setData(response);
        }
      } catch (error) {
        if (active) {
          setData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [timeRange]);

  const totalLCWorkflow =
    data?.lcStageDistribution.reduce((sum, item) => sum + item.value, 0) || 0;
  const maxClientAmount =
    Math.max(...(data?.topClients.map((item) => item.totalAmount) || [1])) || 1;

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-md">
            <LayoutGrid size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              PI Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Proforma invoice command center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm font-semibold text-slate-500 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-800">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total PIs"
          value={String(data?.summary?.totalPI?.value ?? 0)}
          hint="Total proforma invoices generated"
          trend={data?.summary?.totalPI?.trend ?? null}
          metricKey="totalPI"
          icon={<LayoutGrid size={18} />}
        />
        <MetricCard
          title="Awaiting LC"
          value={String(data?.summary?.awaitingLC?.value ?? 0)}
          hint="PIs waiting for letter of credit"
          trend={data?.summary?.awaitingLC?.trend ?? null}
          metricKey="awaitingLC"
          icon={<Clock3 size={18} />}
        />
        <MetricCard
          title="Received LC"
          value={String(data?.summary?.receivedLC?.value ?? 0)}
          hint="PIs with letter of credit received"
          trend={data?.summary?.receivedLC?.trend ?? null}
          metricKey="receivedLC"
          icon={<ReceiptText size={18} />}
        />
      </div>
    </div>
  );
};

export default PIDashboard;
