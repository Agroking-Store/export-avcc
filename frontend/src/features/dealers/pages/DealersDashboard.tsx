import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, TrendingUp, CheckCircle2, Clock3, UserPlus, PlusCircle, ArrowUpRight } from "lucide-react";
import DealerNav from "../components/DealerNav";

const DealersDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [totalDealers, setTotalDealers] = useState(0);
  const [recentDealers, setRecentDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:5000/api/v1/dealers?limit=5&page=1")
      .then(res => {
        setTotalDealers(res.data.total || res.data.data.length);
        setRecentDealers(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 space-y-8">
        <DealerNav />
        {/* Skeleton Header */}
        <div className="rounded-3xl bg-white border p-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded mb-3"></div>
          <div className="h-4 w-80 bg-slate-100 rounded"></div>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white border p-6 animate-pulse"
            >
              <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4"></div>
              <div className="h-3 w-24 bg-slate-100 rounded mb-3"></div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <DealerNav />
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dealers Dashboard
          </h1>
          <p className="text-[15px] text-slate-500 font-medium mt-1">
            Manage dealers and track partnerships efficiently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-sm font-bold text-slate-600">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Dealers"
          value={totalDealers}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Dealers"
          value={totalDealers}
          icon={<TrendingUp size={20} />}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Verified (GST)"
          value={totalDealers}
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Recent"
          value={recentDealers.length}
          icon={<Clock3 size={20} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Add Dealer"
          subtitle="Create new dealer profile"
          icon={<UserPlus size={20} />}
          onClick={() => navigate("/dealers/add")}
        />
        <ActionCard
          title="New Order"
          subtitle="Create dealer export order"
          icon={<PlusCircle size={20} />}
          onClick={() => navigate("/dealers/orders/add")}
        />
      </div>

      {/* RECENT DEALERS TABLE */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-slate-50 rounded-lg">
            <Users size={18} className="text-slate-500" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">
            Recent Dealers
          </h2>
        </div>

        {recentDealers.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
            No dealers found
          </div>
        ) : (
          <div className="space-y-4">
            {recentDealers.map((dealer: any, index: number) => (
              <div
                key={dealer._id || index}
                onClick={() => navigate(`/dealers/${dealer._id}`)}
                className="cursor-pointer flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 px-5 py-4 hover:border-blue-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {dealer.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{dealer.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{dealer.contact}</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                  {dealer.gstNumber || "No GST"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
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

const ActionCard = ({ title, subtitle, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all text-left"
  >
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <ArrowUpRight
        size={20}
        className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
      />
    </div>
    <div className="mt-4 relative z-10">
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  </button>
);

export default DealersDashboard;