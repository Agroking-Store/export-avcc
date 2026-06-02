import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import { toast } from "react-toastify";

const DealersDashboard: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [totalDealers, setTotalDealers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/dealers?limit=5&page=1`)
      .then((res) => {
        setTotalDealers(res.data.total || res.data.data.length);
      })
      .catch((error: any) =>
        toast.error(error.response?.data?.message || "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 dark:bg-gray-800 rounded mb-3"></div>
          <div className="h-4 w-80 bg-slate-100 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="max-w-xs">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-6 animate-pulse">
            <div className="h-10 w-10 bg-slate-200 dark:bg-gray-800 rounded-xl mb-4"></div>
            <div className="h-3 w-24 bg-slate-100 dark:bg-gray-800 rounded mb-3"></div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dealers Dashboard
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-gray-400 font-medium mt-1">
            Manage dealers and track partnerships efficiently.
          </p>
        </div>
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm">
          <span className="text-sm font-bold text-slate-600 dark:text-gray-300">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Dealers"
          value={totalDealers}
          icon={<Users size={20} />}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-all">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
      {icon}
    </div>
    <p className="text-[12px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tight">{title}</p>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{value}</h3>
  </div>
);

export default DealersDashboard;