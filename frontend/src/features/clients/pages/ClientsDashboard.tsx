import { useEffect, useState } from "react";
import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useMemo } from "react";

interface Client {
  _id: string;
  name: string;
  companyName?: string;
  country: string;
  totalOrders?: number;
}

interface Vehicle {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  orderId: string;
  clientName: string;
  companyName?: string;
  vehicles: Vehicle[];
  status: string;
  createdAt: string;
}

const ClientsDashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      await Promise.all([fetchClients(), fetchOrders()]);
      setLoading(false);
    };
  
    loadDashboard();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${apiConfig.baseURL}/clients?limit=1000`);
      setClients(res.data.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${apiConfig.baseURL}/orders?limit=1000`);
      setOrders(res.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  /* KPI METRICS */
  const totalClients = clients.length;
  const totalOrders = orders.length;
  const totalVehicles = useMemo(() => {
    return orders.reduce((sum, o) => {
      const qty = o.vehicles?.filter(v => v != null).reduce((s, v) => s + (v.quantity ?? 0), 0) ?? 0;
      return sum + qty;
    }, 0);
  }, [orders]);
  const draftOrders = orders.filter(o => o.status === "Draft").length;
  const confirmedOrders = orders.filter(o => o.status === "Confirmed").length;

  /* DATA TRANSFORMATIONS */
  const countryStats: Record<string, number> = {};
  clients.forEach(c => {
    if (!countryStats[c.country]) countryStats[c.country] = 0;
    countryStats[c.country]++;
  });

  const countryChart = Object.keys(countryStats).map(c => ({
    country: c,
    clients: countryStats[c]
  }));

  const topClients = [...clients]
    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 5);

  const ordersByMonth: any = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString("default", { month: "short" });
    if (!ordersByMonth[month]) ordersByMonth[month] = 0;
    ordersByMonth[month]++;
  });

  const ordersChart = Object.keys(ordersByMonth).map((m) => ({
    month: m,
    orders: ordersByMonth[m],
  }));

  const vehicleStats: Record<string, number> = {};
  orders.forEach((o) => {
    o.vehicles?.forEach((v) => {
      if (v?.name) {
        if (!vehicleStats[v.name]) vehicleStats[v.name] = 0;
        vehicleStats[v.name] += (v.quantity ?? 0);
      }
    });
  });

  const topVehicles = Object.keys(vehicleStats)
    .map((v) => ({ model: v, qty: vehicleStats[v] }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
          Loading dashboard...
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 lg:p-10 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Clients Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Global export analytics and order lifecycle management.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Clients", val: totalClients, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Orders", val: totalOrders, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Vehicles Exported", val: totalVehicles, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Confirmed Orders", val: confirmedOrders,  color: "text-emerald-600",  bg: "bg-emerald-50"},
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <h3 className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.val}</h3>
          </div>
        ))}
      </div>

      {/* MAIN CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
    Orders Trend
  </h3>

  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={ordersChart}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5f5" />

      <XAxis
        dataKey="month"
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#94a3b8", fontSize: 12 }}
      />

      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#94a3b8", fontSize: 12 }}
      />

      <Tooltip
        cursor={{ fill: "rgba(148,163,184,0.15)" }}
        contentStyle={{
          backgroundColor: "#1e293b",
          border: "none",
          borderRadius: "10px",
          color: "#f1f5f9",
        }}
        labelStyle={{ color: "#94a3b8" }}
      />

      <Line
        type="monotone"
        dataKey="orders"
        stroke="#10b981"
        strokeWidth={3}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Orders Volume</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ordersChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5f5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.15)" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "10px",
                  color: "#f1f5f9"
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#38bdf8" }}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY INSIGHTS & TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* TOP VEHICLES TABLE */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-800 dark:text-white">Top Models</h3>
          </div>
          <div className="p-2">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-widest">
                  <th className="px-4 py-3 font-semibold">Model</th>
                  <th className="px-4 py-3 font-semibold text-right">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {topVehicles.map((v) => (
                  <tr key={v.model} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">{v.model}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-600 dark:text-blue-400">{v.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COUNTRY BAR CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Distribution by Country</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={countryChart} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="country" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.15)" }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "10px",
                  color: "#f1f5f9"
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar dataKey="clients" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-yellow-400 shadow-sm">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Draft Orders</p>
            <h3 className="text-2xl font-black dark:text-white">{draftOrders}</h3>
          </div>
          <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600">📝</div>
        </div>
        <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-emerald-400 shadow-sm">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Confirmed Orders</p>
            <h3 className="text-2xl font-black dark:text-white">{confirmedOrders}</h3>
          </div>
          <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">✅</div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Order Activity</h3>
          <button className="text-sm text-blue-600 font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Client Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Units</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
{orders.slice(0, 5).map(o => {
                const qty = o.vehicles?.filter(v => v != null).reduce((s, v) => s + (v.quantity ?? 0), 0) ?? 0;
                const isConfirmed = o.status === "Confirmed";
                
                return (
                  <tr key={o._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-blue-500 font-bold">{o.orderId}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 dark:text-white">{o.clientName}</div>
                      <div className="text-xs text-gray-400">{o.companyName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold dark:text-gray-300">{qty}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isConfirmed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP CLIENTS SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Top Performing Clients</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 divide-x divide-gray-100 dark:divide-gray-700">
          {topClients.map(c => (
            <div key={c._id} className="p-6 flex flex-col items-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-3 uppercase">
                {c.name.charAt(0)}
              </div>
              <h4 className="font-bold text-gray-800 dark:text-white truncate w-full px-2">{c.name}</h4>
              <p className="text-xs text-gray-400 mb-2 truncate w-full">{c.companyName}</p>
              <div className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-3 py-1 rounded-full">
                {c.totalOrders || 0} Orders
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientsDashboard;