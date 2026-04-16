import React, { useState, useEffect } from 'react';
import { vehicleApi, VehicleStats } from '../../../services/vehicleApi';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

interface Order {
  _id: string;
  orderId: string;
  status: string;
  vehicles: Array<{
    name: string;
    quantity: number;
    color: string;
  }>;
  createdAt: string;
}

const Vehicles: React.FC = () => {
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await vehicleApi.getStats();
        if (response.success) {
          setStats(response.data!);
        }
      } catch (error) {
        console.error('Failed to fetch vehicle stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await axios.get(`${apiConfig.baseURL}/orders?limit=1000`);
        setOrders(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchStats();
    fetchOrders();
  }, []);

  const totalVehicles = loadingStats ? 0 : (stats?.total ?? 0);
  const availableVehicles = loadingStats ? 0 : (stats?.available ?? 0);
  
  const orderStats = {
    draft: orders.filter(o => o.status === "Draft").length,
    confirmed: orders.filter(o => o.status === "Confirmed").length,
    piGenerated: orders.filter(o => o.status === "PI Generated").length,
    shipped: orders.filter(o => o.status === "Shipped").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
  };

  const vehiclesByStatus = {
    available: availableVehicles,
    booked: orderStats.confirmed,
    piGenerated: orderStats.piGenerated,
    shipped: orderStats.shipped,
    delivered: orderStats.delivered,
  };

  /* DATA TRANSFORMATIONS */
  const ordersByMonth: Record<string, number> = {};
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

  const statusDistribution = [
    { name: 'Available', value: vehiclesByStatus.available, color: '#10b981' },
    { name: 'Booked', value: vehiclesByStatus.booked, color: '#3b82f6' },
    { name: 'PI Generated', value: vehiclesByStatus.piGenerated, color: '#8b5cf6' },
    { name: 'In Transit', value: vehiclesByStatus.shipped, color: '#6366f1' },
    { name: 'Delivered', value: vehiclesByStatus.delivered, color: '#14b8a6' }
  ];

  if (loadingStats || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading vehicles dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 lg:p-10 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Vehicle Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Vehicle inventory and export analytics.
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
          { label: "Total Vehicles", val: totalVehicles, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Available", val: vehiclesByStatus.available, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Booked", val: vehiclesByStatus.booked, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "PI Generated", val: vehiclesByStatus.piGenerated, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <h3 className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.val}</h3>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
            Orders Trend
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={ordersChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5f5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
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
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RechartsPieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "10px",
                  color: "#f1f5f9"
                }}
                itemStyle={{ color: "#f1f5f9" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECONDARY INSIGHTS */}
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
                {topVehicles.length === 0 && (
                   <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500 italic">No vehicles ordered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY BREAKDOWN */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-yellow-400 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Draft Orders</p>
              <h3 className="text-2xl font-black dark:text-white">{orderStats.draft}</h3>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600">📝</div>
          </div>
          <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-emerald-400 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Confirmed Orders</p>
              <h3 className="text-2xl font-black dark:text-white">{orderStats.confirmed}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">✅</div>
          </div>
          <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-indigo-400 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Shipped Units</p>
              <h3 className="text-2xl font-black dark:text-white">{orderStats.shipped}</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">🚚</div>
          </div>
          <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-teal-400 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Delivered Units</p>
              <h3 className="text-2xl font-black dark:text-white">{orderStats.delivered}</h3>
            </div>
            <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600">📦</div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Vehicles;