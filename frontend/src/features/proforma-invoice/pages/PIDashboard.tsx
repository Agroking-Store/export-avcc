import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// KPI Data for the overall page
const kpiData = [
  {
    title: "Active Pipeline Value",
    value: "$2.4M",
    trend: "+12.5%",
    trendUp: true,
  },
  {
    title: "Pending Approval",
    value: "14 Deals",
    trend: "-2.4%",
    trendUp: false,
  },
  {
    title: "Secured Deals (LC)",
    value: "45 Deals",
    trend: "+8.2%",
    trendUp: true,
  },
  {
    title: "At-Risk / Expiring",
    value: "6 PIs",
    trend: "+1.2%",
    trendUp: false, // For expiring deals, an upward trend is negative
  },
];

const PIDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpiData.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow duration-200"
        >
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
            {kpi.title}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
            {kpi.value}
          </p>
          <div className="flex items-center mt-auto">
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                kpi.trendUp
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {kpi.trendUp ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {kpi.trend}
            </div>
            <span className="text-xs text-gray-400 ml-2 font-medium">
              vs last month
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PIDashboard;
