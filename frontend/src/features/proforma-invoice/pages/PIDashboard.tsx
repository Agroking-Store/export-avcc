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
    {
      draft: "bg-slate-100 text-slate-700",
      pending_approval: "bg-amber-100 text-amber-800",
      approved: "bg-blue-100 text-blue-800",
      sent_to_buyer: "bg-sky-100 text-sky-800",
      lc_received: "bg-teal-100 text-teal-800",
      expired: "bg-rose-100 text-rose-800",
    } as Record<string, string>
  )[status] || "bg-slate-100 text-slate-700";

const getLCStageClass = (stage: string) =>
  (
    {
      "Awaiting LC": "bg-amber-50 text-amber-700 border-amber-200",
      "Received LC": "bg-blue-50 text-blue-700 border-blue-200",
      "Verified LC": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Amendment Needed": "bg-rose-50 text-rose-700 border-rose-200",
      "In Preparation": "bg-slate-50 text-slate-600 border-slate-200",
    } as Record<string, string>
  )[stage] || "bg-slate-50 text-slate-600 border-slate-200";

const daysUntil = (date?: string) => {
  if (!date) {
    return null;
  }

  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
};

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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{title}</p>
      </div>
      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
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
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{eyebrow}</p>
    <div className="mb-5 mt-2">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl bg-slate-200" />
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
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

  if (loading) {
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">PI Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Performa invoice command center
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
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total PIs" value={data?.summary.totalPI.value || 0} icon={<LayoutGrid size={20} />} color="bg-blue-50 text-blue-600" border="border-blue-200" />
        <SummaryCard label="Awaiting LC" value={data?.summary.awaitingLC.value || 0} icon={<Clock3 size={20} />} color="bg-amber-50 text-amber-600" border="border-amber-200" />
        <SummaryCard label="Received LC" value={data?.summary.receivedLC.value || 0} icon={<ReceiptText size={20} />} color="bg-indigo-50 text-indigo-600" border="border-indigo-200" />
        <SummaryCard label="Verified LC" value={data?.summary.verifiedLC.value || 0} icon={<ShieldCheck size={20} />} color="bg-emerald-50 text-emerald-600" border="border-emerald-200" />
      </div>

      {/* Actionable Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard label="Amendment Needed" value={data?.summary.amendmentLC.value || 0} icon={<AlertTriangle size={18} />} color="text-rose-600" onClick={() => navigate("/proforma-invoice/list", { state: { statusFilter: "amendment_lc" } })} />
        <ActionCard label="Draft + Approval" value={data?.health.draftOrApproval ?? 0} icon={<FileText size={18} />} color="text-slate-600" onClick={() => navigate("/proforma-invoice/list", { state: { statusFilter: "draft,pending_approval" } })} />
        <ActionCard label="Expiring Soon" value={data?.health.expiringSoon ?? 0} icon={<AlertTriangle size={18} />} color="text-amber-600" onClick={() => navigate("/proforma-invoice/list", { state: { statusFilter: "expiring_soon" } })} />
        <ActionCard label="Active Buyers" value={data?.health.buyersWithActivity ?? 0} icon={<UserRound size={18} />} color="text-blue-600" onClick={() => navigate("/proforma-invoice/list")} />
      </div>

      {/* Status Distribution Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">LC Status Distribution</h3>
        <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-800">
          {totalLCWorkflow > 0 && (
            <>
              <StatusBarSegment count={data?.lcStageDistribution.find(s => s.key === "awaiting_lc")?.value || 0} total={totalLCWorkflow} color="bg-amber-400" />
              <StatusBarSegment count={data?.lcStageDistribution.find(s => s.key === "received_lc")?.value || 0} total={totalLCWorkflow} color="bg-blue-400" />
              <StatusBarSegment count={data?.lcStageDistribution.find(s => s.key === "verified_lc")?.value || 0} total={totalLCWorkflow} color="bg-emerald-400" />
              <StatusBarSegment count={data?.lcStageDistribution.find(s => s.key === "amendment_lc")?.value || 0} total={totalLCWorkflow} color="bg-rose-400" />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <LegendDot color="bg-amber-400" label="Awaiting LC" value={data?.lcStageDistribution.find(s => s.key === "awaiting_lc")?.value || 0} />
          <LegendDot color="bg-blue-400" label="Received LC" value={data?.lcStageDistribution.find(s => s.key === "received_lc")?.value || 0} />
          <LegendDot color="bg-emerald-400" label="Verified LC" value={data?.lcStageDistribution.find(s => s.key === "verified_lc")?.value || 0} />
          <LegendDot color="bg-rose-400" label="Amendment Needed" value={data?.lcStageDistribution.find(s => s.key === "amendment_lc")?.value || 0} />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          title="Total PI Amount"
          value={formatCurrency(data?.summary.totalPIAmount.value || 0)}
          hint="Aggregate PI value"
          trend={data?.summary.totalPIAmount.trend ?? null}
          metricKey="totalPIAmount"
          icon={<HandCoins className="h-5 w-5" />}
        />
        <MetricCard
          title="Awaiting LC"
          value={String(data?.summary.awaitingLC.value || 0)}
          hint="Buyer follow-up pending"
          trend={data?.summary.awaitingLC.trend ?? null}
          metricKey="awaitingLC"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Amendment LC"
          value={String(data?.summary.amendmentLC.value || 0)}
          hint="Mismatch needs correction"
          trend={data?.summary.amendmentLC.trend ?? null}
          metricKey="amendmentLC"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PI Value Trend */}
        <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Momentum</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">PI value trend</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Value and count movement in the selected range</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="piValueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="piCountFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 6" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="amount"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(value) => formatCompactNumber(Number(value))}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: any) => [
                    name === "PI Value" ? formatCurrency(Number(value || 0)) : Number(value || 0),
                    name,
                  ]}
                />
                <Area
                  yAxisId="amount"
                  type="monotone"
                  dataKey="totalAmount"
                  name="PI Value"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="url(#piValueFill)"
                />
                <Area
                  yAxisId="count"
                  type="monotone"
                  dataKey="totalPI"
                  name="PI Count"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#piCountFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PI Status Distribution Pie */}
        <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mix</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">PI status distribution</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Selected range ka documentation spread</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data?.piStatusDistribution || []).filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(data?.piStatusDistribution || [])
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell
                          key={entry.key}
                          fill={PI_STATUS_COLORS[index % PI_STATUS_COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {(data?.piStatusDistribution || []).map((item, index) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 dark:bg-gray-800/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: PI_STATUS_COLORS[index % PI_STATUS_COLORS.length],
                      }}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-base font-bold text-slate-800 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LC Workflow Stages */}
        <SectionShell
          eyebrow="LC Pipeline"
          title="Where the LC workflow is stuck"
          subtitle="These stages help you immediately spot buyer follow-up, verification progress, and amendment pressure."
        >
          <div className="space-y-4">
            {data?.lcStageDistribution.map((stage) => {
              const percent =
                totalLCWorkflow > 0
                  ? Math.max((stage.value / totalLCWorkflow) * 100, stage.value > 0 ? 6 : 0)
                  : 0;

              return (
                <div key={stage.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {stage.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        {stage.value === 0
                          ? "No records in this stage"
                          : `${formatCompactNumber(stage.value)} records currently here`}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                      {stage.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[stage.key] || "bg-slate-400"}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="grid gap-3 pt-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Verification Rate
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-300">
                  {data?.health.verificationRate ?? 0}%
                </p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/70 dark:bg-rose-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Amendment Rate
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-950 dark:text-rose-300">
                  {data?.health.amendmentRate ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </SectionShell>

        {/* Top PI Buyers */}
        <SectionShell
          eyebrow="Buyers"
          title="Top PI buyers"
          subtitle="Highest PI value contributing clients, so you can prioritize follow-up and LC conversion on the biggest accounts."
        >
          <div className="space-y-3">
            {(data?.topClients || []).map((client, index) => (
              <div key={client.clientName} className="rounded-xl border border-slate-100 bg-slate-50/70 dark:bg-gray-800/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Buyer {index + 1}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {client.clientName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      {client.totalPI} PI{client.totalPI > 1 ? "s" : ""} in selected range
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-800 dark:text-white">
                      {formatCurrency(client.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
                    style={{
                      width: `${Math.max(
                        (client.totalAmount / maxClientAmount) * 100,
                        8,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {(!data?.topClients || data.topClients.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/30 px-4 py-8 text-center text-xs text-slate-500 dark:text-gray-400">
                No buyer activity in this range yet.
              </div>
            )}
          </div>
        </SectionShell>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Flow</p>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Latest PI activity</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">Naye PI entries ke saath unka LC state aur expiry urgency</p>
        </div>
        <div className="space-y-3">
          {(data?.recentActivity || []).map((item) => {
            const remainingDays = daysUntil(item.validityDate);
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/proforma-invoice/${item.id}`)}
                className="flex w-full flex-col gap-3 rounded-xl border border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/30 px-4 py-3 text-left transition-all hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                      <FileBadge2 className="mr-1 h-3 w-3" />
                      {item.piNumber}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPIStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLCStageClass(
                        item.lcStage,
                      )}`}
                    >
                      {item.lcStage}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      {item.clientName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {formatCurrency(item.totalAmount)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                      Created{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-gray-800 pt-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Validity
                    </p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">
                      {item.validityDate
                        ? new Date(item.validityDate).toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "Not set"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400">
                      {remainingDays === null
                        ? "No validity date"
                        : remainingDays < 0
                          ? "Already expired"
                          : `${remainingDays} day${
                              remainingDays === 1 ? "" : "s"
                            } left`}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}

          {(!data?.recentActivity || data.recentActivity.length === 0) && (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-800/30 px-4 py-10 text-center text-xs text-slate-500 dark:text-gray-400">
              No recent PI activity found for this range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PIDashboard;