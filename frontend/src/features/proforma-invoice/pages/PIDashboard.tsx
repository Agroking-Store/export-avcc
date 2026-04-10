import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Inbox } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card"; // Corrected import for Card
import { piApi } from "../components/piApi"; // Assuming piApi will have dashboard endpoints
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
} from "recharts"; // Assuming Recharts for charts
import { Skeleton } from "@/components/ui/skeleton";

const PieChartSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-64 rounded-lg p-4">
    <Skeleton className="w-32 h-32 rounded-full bg-gray-300 mb-4" />
    <Skeleton className="h-4 w-40 bg-gray-300 rounded mb-2" />
    <Skeleton className="h-3 w-32 bg-gray-300 rounded" />
  </div>
);

const LineChartSkeleton: React.FC = () => (
  <div className="flex flex-col justify-between h-64 rounded-lg p-4">
    <div className="flex justify-between mb-2">
      <Skeleton className="h-3 w-1/4 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/6 bg-gray-300 rounded" />
    </div>
    <div className="grow relative">
      <Skeleton className="absolute inset-0 bg-gray-300 rounded" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-1 w-full bg-gray-400 rounded-full opacity-50 transform rotate-3" />
      </div>
    </div>
    <div className="flex justify-between mt-2">
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
    </div>
  </div>
);

const BarChartSkeleton: React.FC = () => (
  <div className="flex flex-col justify-between h-64 rounded-lg p-4">
    <div className="flex justify-between mb-2">
      <Skeleton className="h-3 w-1/4 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/6 bg-gray-300 rounded" />
    </div>
    <div className="grow flex items-end gap-2 px-2">
      <Skeleton className="w-1/5 h-3/4 bg-gray-300 rounded-t" />
      <Skeleton className="w-1/5 h-1/2 bg-gray-300 rounded-t" />
      <Skeleton className="w-1/5 h-full bg-gray-300 rounded-t" />
      <Skeleton className="w-1/5 h-2/3 bg-gray-300 rounded-t" />
      <Skeleton className="w-1/5 h-1/3 bg-gray-300 rounded-t" />
    </div>
    <div className="flex justify-between mt-2">
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
      <Skeleton className="h-3 w-1/5 bg-gray-300 rounded" />
    </div>
  </div>
);

// Define colors for the pie chart slices
const COLORS = [
  // More aesthetic and modern color palette
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#FFC107", // Amber
  "#FF5722", // Deep Orange
  "#9C27B0", // Purple
  "#00BCD4", // Cyan
  "#E91E63", // Pink
  "#607D8B", // Blue Grey
];

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  isLoading: boolean;
}
const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  trendUp,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow duration-200">
      <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
        {title}
      </h3>
      {isLoading ? (
        <Skeleton className="h-8 w-3/4 bg-gray-300 rounded mb-4" />
      ) : (
        <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">
          {value}
        </p>
      )}
      <div className="flex items-center mt-auto h-6">
        {isLoading ? (
          <Skeleton className="h-4 w-24 bg-gray-300 rounded" />
        ) : trend ? (
          <>
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                trendUp
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend}
            </div>
            <span className="text-xs text-gray-400 ml-2 font-medium">
              vs last month
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-medium">
            No trend data
          </span>
        )}
      </div>
    </div>
  );
};

interface DashboardKPIs {
  activePipelineValue: { value: number; trend?: number };
  pendingApprovals: { value: number; trend?: number };
  expiringPIs: { value: number; trend?: number };
  overallOrderPICompletion: { value: number; trend?: number };
}

interface PIStatusDistributionData {
  status: string;
  count: number;
}

interface MonthlyPIValueTrendData {
  year: number;
  month: number;
  totalAmount: number;
}

interface TopClientsByPIValueData {
  clientName: string;
  totalAmount: number;
  _id?: string; // Optional, if backend sends it
}

const PIDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("thisMonth");
  const [kpiData, setKpiData] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [piStatusDistribution, setPiStatusDistribution] = useState<
    PIStatusDistributionData[]
  >([]);
  const [monthlyPIValueTrend, setMonthlyPIValueTrend] = useState<
    MonthlyPIValueTrendData[]
  >([]);
  const [topClientsByPIValue, setTopClientsByPIValue] = useState<
    TopClientsByPIValueData[]
  >([]);
  const [isChartsLoading, setIsChartsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setIsChartsLoading(true);
      try {
        const [
          kpiResponse,
          statusDistributionResponse,
          monthlyTrendResponse,
          topClientsResponse,
        ] = await Promise.all([
          piApi.getDashboardKPIs(timeRange),
          piApi.getPIStatusDistribution(timeRange),
          piApi.getMonthlyPIValueTrend(timeRange),
          piApi.getTopClientsByPIValue(timeRange, 5),
        ]);

        setKpiData(kpiResponse); // Backend now returns the full object with trends
        setPiStatusDistribution(statusDistributionResponse);
        setMonthlyPIValueTrend(monthlyTrendResponse);
        setTopClientsByPIValue(topClientsResponse);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setKpiData(null); // Clear data on error
        setPiStatusDistribution([]);
        setMonthlyPIValueTrend([]);
        setTopClientsByPIValue([]);
      } finally {
        setIsLoading(false);
        setIsChartsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]); // Refetch when timeRange changes

  // Helper to format status names for display
  const formatStatusName = (status: string) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatMonth = (monthNum: number) => {
    return new Date(0, monthNum - 1).toLocaleString("en-US", {
      month: "short",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-10 w-36 px-4 py-6 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg cursor-pointer">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="today" className="text-base">
              Today
            </SelectItem>
            <SelectItem value="thisWeek" className="text-base">
              This Week
            </SelectItem>
            <SelectItem value="thisMonth" className="text-base">
              This Month
            </SelectItem>
            <SelectItem value="thisYear" className="text-base">
              This Year
            </SelectItem>
            <SelectItem value="allTime" className="text-base">
              All Time
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title="Active Pipeline Value"
          value={
            kpiData?.activePipelineValue.value
              ? `$${(kpiData.activePipelineValue.value / 1000000).toFixed(1)}M`
              : "$0M"
          }
          trend={
            kpiData?.activePipelineValue.trend !== null &&
            kpiData?.activePipelineValue.trend !== undefined
              ? `${(kpiData.activePipelineValue.trend * 100).toFixed(1)}%`
              : undefined
          }
          trendUp={
            kpiData?.activePipelineValue.trend
              ? kpiData.activePipelineValue.trend > 0
              : undefined
          }
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Approvals"
          value={
            kpiData?.pendingApprovals.value
              ? `${kpiData.pendingApprovals.value} PIs`
              : "0 PIs"
          }
          trend={
            kpiData?.pendingApprovals.trend
              ? `${(kpiData.pendingApprovals.trend * 100).toFixed(1)}%`
              : undefined
          }
          trendUp={
            kpiData?.pendingApprovals.trend
              ? kpiData.pendingApprovals.trend > 0
              : undefined
          }
          isLoading={isLoading}
        />
        <KPICard
          title="Expiring PIs (Next 7 Days)"
          value={
            kpiData?.expiringPIs.value
              ? `${kpiData.expiringPIs.value} PIs`
              : "0 PIs"
          }
          trend={
            kpiData?.expiringPIs.trend
              ? `${(kpiData.expiringPIs.trend * 100).toFixed(1)}%`
              : undefined
          }
          trendUp={
            kpiData?.expiringPIs.trend
              ? kpiData.expiringPIs.trend < 0
              : undefined
          } // Upward trend for expiring is bad
          isLoading={isLoading}
        />
        <KPICard
          title="Overall Order PI Completion"
          value={
            kpiData?.overallOrderPICompletion.value !== undefined
              ? `${kpiData.overallOrderPICompletion.value.toFixed(1)}%`
              : "0%"
          }
          trend={
            kpiData?.overallOrderPICompletion.trend
              ? `${(kpiData.overallOrderPICompletion.trend * 100).toFixed(1)}%`
              : undefined
          }
          trendUp={
            kpiData?.overallOrderPICompletion.trend
              ? kpiData.overallOrderPICompletion.trend > 0
              : undefined
          }
          // For completion, an upward trend is good
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* PI Status Distribution Chart */}
        {/* PI Status Distribution Chart */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-gray-700 text-lg font-semibold mb-4">
            PI Status Distribution
          </h3>
          {isChartsLoading ? (
            <PieChartSkeleton />
          ) : piStatusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={piStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  cornerRadius="50%" // Added for rounded corners
                  paddingAngle={3} // Added for gaps between slices
                  fill="#8884d8"
                  label={({ name, percent }) =>
                    `${formatStatusName(name as string)} ${(
                      (percent ?? 0) * 100
                    ).toFixed(0)}%`
                  }
                >
                  {piStatusDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} PIs`,
                    formatStatusName(name as string),
                  ]}
                />
                <Legend formatter={(value) => formatStatusName(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
              <Inbox className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">No PI Status Data Available</p>
              <p className="text-sm">Try adjusting the time range.</p>
            </div>
          )}
        </Card>

        {/* Monthly PI Value Trend Chart */}

        {/* Monthly PI Value Trend Chart */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-gray-700 text-lg font-semibold mb-4">
            Monthly PI Value Trend
          </h3>
          {isChartsLoading ? (
            <LineChartSkeleton />
          ) : monthlyPIValueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={monthlyPIValueTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  label={{
                    value: "Month",
                    position: "insideBottom",
                    offset: 0,
                  }}
                />
                <YAxis
                  label={{
                    value: "Value ($)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `$${Number(value || 0).toLocaleString()}`,
                    "Total Value",
                  ]}
                  labelFormatter={(label) => `${formatMonth(Number(label))}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#2196F3"
                  activeDot={{ r: 8 }}
                  name="PI Value"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
              <Inbox className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">
                No Monthly PI Value Data Available
              </p>
              <p className="text-sm">Try adjusting the time range.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Top 5 Clients by PI Value Bar Chart */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-gray-700 text-lg font-semibold mb-4">
          Top 5 Clients by PI Value
        </h3>
        {isChartsLoading ? (
          <BarChartSkeleton />
        ) : topClientsByPIValue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topClientsByPIValue}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis type="category" dataKey="clientName" width={100} />
              <Tooltip
                formatter={(value: any) => [
                  `$${Number(value || 0).toLocaleString()}`,
                  "Total Value",
                ]}
              />
              <Legend />
              <Bar dataKey="totalAmount" fill="#4CAF50" name="Total PI Value">
                <LabelList
                  dataKey="totalAmount"
                  position="right"
                  formatter={(value: any) =>
                    `$${((Number(value) || 0) / 1000).toFixed(0)}k`
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
            <Inbox className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No Top Clients Data Available</p>
            <p className="text-sm">Try adjusting the time range.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PIDashboard;
