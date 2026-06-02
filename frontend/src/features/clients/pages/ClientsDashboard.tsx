import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import { apiConfig } from "../../../config/apiConfig";

const ClientsDashboard = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const clientsRes = await axios.get(`${apiConfig.baseURL}/clients?limit=1000`);
        setClients(clientsRes.data.data || clientsRes.data || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const totalClients = useMemo(() => clients.length, [clients]);

  if (loading) {
    return (
      <div className="w-full p-8 space-y-8">
        <div className="rounded-3xl bg-white border p-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded mb-3"></div>
          <div className="h-4 w-80 bg-slate-100 rounded"></div>
        </div>
        <div className="max-w-xs">
          <div className="rounded-2xl bg-white border p-6 animate-pulse">
            <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4"></div>
            <div className="h-3 w-24 bg-slate-100 rounded mb-3"></div>
            <div className="h-8 w-16 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Clients Dashboard
        </h1>
        <p className="text-[15px] text-slate-500 font-medium mt-1">
          Manage clients and track orders efficiently.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={totalClients}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
      {icon}
    </div>
    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">{title}</p>
    <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{value}</h3>
  </div>
);

export default ClientsDashboard;