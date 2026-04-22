import React, { useState, useEffect, useMemo } from 'react';
import { vehicleApi, VehicleStats } from '../../../services/vehicleApi';
import { bookingApi } from '../../../services/bookingApi';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';
import { useNavigate } from 'react-router-dom';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Car, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  Package, 
  Truck, 
  ShieldCheck,
  LayoutDashboard,
  Search,
  Plus
} from 'lucide-react';

interface Order {
  _id: string;
  orderId: string;
  status: string;
  vehicles: Array<{
    name: string;
    quantity: number;
    color: string;
    status?: string;
  }>;
  createdAt: string;
}

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes, bookingsRes] = await Promise.all([
          vehicleApi.getStats().catch(() => ({ success: false, data: null })),
          axios.get(`${apiConfig.baseURL}/orders?limit=1000`).catch(() => ({ data: { data: [] } })),
          bookingApi.getAll().catch(() => ({ data: { data: [] } }))
        ]);

        if (statsRes.success) setStats(statsRes.data!);
        
        const orderList = ordersRes.data?.data || ordersRes.data?.orders || ordersRes.data || [];
        setOrders(Array.isArray(orderList) ? orderList : []);

        const bookingList = bookingsRes.data?.data || bookingsRes.data?.bookings || bookingsRes.data || [];
        setBookings(Array.isArray(bookingList) ? bookingList : []);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 🔄 CALCULATION ENGINE: Counting EVERY vehicle across orders and lifecycle
  const vehicleMetrics = useMemo(() => {
    const counts = {
      available: 0,
      booked: 0,
      piCreated: 0,
      lcReceived: 0,
      invoiceCreated: 0,
      confirmed: 0,
      total: 0
    };

    // 1. Count from Bookings (Active Lifecycle)
    // We count vehicles in the bookings and their specific statuses
    bookings.forEach(booking => {
      booking.vehicles?.forEach((v: any) => {
        const s = v.status || booking.status;
        if (s === "Booked") counts.booked++;
        else if (s === "PI Created") counts.piCreated++;
        else if (s === "LC Received") counts.lcReceived++;
        else if (s === "Invoice Created") counts.invoiceCreated++;
      });
    });

    // 2. Count from Orders (Total Intent & New Units)
    orders.forEach(order => {
      const orderVehiclesCount = order.vehicles?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
      
      // If order is "Confirmed", we add to pipeline count
      if (order.status === "Confirmed") {
        counts.confirmed += orderVehiclesCount;
      }

      // "Available" units are typically those in Orders that haven't been "Booked" yet.
      // However, a simple way is (Total in Orders) - (Total in Bookings)
      // Or just sum up quantities in Orders as Total.
      counts.total += orderVehiclesCount;
    });

    // Available = Total Intent - Committed (Sum of all active booking stages)
    const committedTotal = counts.booked + counts.piCreated + counts.lcReceived + counts.invoiceCreated;
    counts.available = Math.max(0, counts.total - committedTotal);

    return counts;
  }, [orders, bookings]);

  const statusDistribution = [
    { name: 'Available', value: vehicleMetrics.available, color: '#10b981' },
    { name: 'Booked', value: vehicleMetrics.booked, color: '#3b82f6' },
    { name: 'PI Ongoing', value: vehicleMetrics.piCreated, color: '#8b5cf6' },
    { name: 'In Finance', value: vehicleMetrics.lcReceived, color: '#6366f1' },
    { name: 'Shipped', value: vehicleMetrics.invoiceCreated, color: '#14b8a6' }
  ];

  const ordersChartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString("default", { month: "short" }));
    }

    const counts: Record<string, number> = Object.fromEntries(months.map(m => [m, 0]));
    
    orders.forEach((o) => {
      const date = new Date(o.createdAt);
      const month = date.toLocaleString("default", { month: "short" });
      if (counts[month] !== undefined) {
        counts[month]++;
      }
    });

    return months.map(m => ({ month: m, orders: counts[m] }));
  }, [orders]);

  const topVehicles = useMemo(() => {
    const vehicleStats: Record<string, number> = {};
    orders.forEach((o) => {
      o.vehicles?.forEach((v) => {
        if (v?.name) {
          vehicleStats[v.name] = (vehicleStats[v.name] || 0) + (v.quantity ?? 0);
        }
      });
    });
    return Object.entries(vehicleStats)
      .map(([model, qty]) => ({ model, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-8 flex flex-col items-center justify-center">
         <div className="w-12 h-12 border-4 border-[#5243EF] border-t-transparent rounded-full animate-spin mb-4" />
         <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-all duration-500 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <LayoutDashboard size={20} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vehicles Overview</h1>
          </div>
          <p className="text-[15px] text-slate-500 font-medium dark:text-gray-400">Tracking every vehicle across the export lifecycle.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm text-sm font-bold text-slate-600 dark:text-gray-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Total Vehicles" 
          value={vehicleMetrics.total} 
          icon={<Car size={20} />} 
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
        />
        <KpiCard 
          label="Available" 
          value={vehicleMetrics.available} 
          icon={<CheckCircle2 size={20} />} 
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
        />
        <KpiCard 
          label="Booked" 
          value={vehicleMetrics.booked} 
          icon={<Clock size={20} />} 
          color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
        />
        <KpiCard 
          label="Confirmed Pipeline" 
          value={vehicleMetrics.confirmed} 
          icon={<TrendingUp size={20} />} 
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" 
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionTile 
          title="Vehicle List" 
          desc="Manage dedicated vehicle inventory" 
          icon={<Car size={22} />} 
          onClick={() => navigate('/vehicles/list')} 
        />
        <ActionTile 
          title="Vehicle Orders" 
          desc="Create orders from the vehicle list" 
          icon={<Search size={22} />} 
          onClick={() => navigate('/vehicles/orders')} 
        />
      </div>

      {/* VISUALS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-gray-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white underline decoration-blue-500/30 underline-offset-8">Sales Trend</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-gray-800 px-3 py-1 rounded-full">Last 6 Months</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersChartData}>
                <defs>
                  <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "16px", color: "#f1f5f9", padding: "12px" }}
                />
                <Area type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorOrd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-gray-800 transition-all hover:shadow-md">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8">Vehicle Distribution</h3>
          <div className="flex items-center justify-center -mt-6">
            <ResponsiveContainer width="100%" height={240}>
              <RechartsPieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "16px", color: "#f1f5f9" }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-500 dark:text-gray-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors capitalize">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-slate-50 dark:border-gray-800 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">Most Popular Models</h3>
              <Plus size={20} className="text-slate-300 cursor-pointer hover:text-blue-500" />
           </div>
           <div className="space-y-4">
              {topVehicles.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm italic">No data yet</div>
              ) : topVehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F9FB] dark:bg-gray-800/50 border border-slate-50 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 group transition-all">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-blue-600 font-bold border border-slate-100 dark:border-gray-800">
                        {v.model.charAt(0)}
                     </div>
                     <span className="font-bold text-slate-700 dark:text-gray-200">{v.model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-black text-blue-600 dark:text-blue-400">{v.qty} Vehicles</span>
                     <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <PipelineCard label="Order Vouchers" val={orders.length} icon={<Package size={22} />} border="border-l-blue-600" bg="bg-blue-50/50" text="text-blue-600" />
           <PipelineCard label="Confirmed Vehicle Pipeline" val={vehicleMetrics.confirmed} icon={<ShieldCheck size={22} />} border="border-l-emerald-500" bg="bg-emerald-50/50" text="text-emerald-600" />
           <PipelineCard label="In Transit" val={0} icon={<Truck size={22} />} border="border-l-indigo-400" bg="bg-indigo-50/50" text="text-indigo-600" />
           <PipelineCard label="Completed Deliveries" val={0} icon={<CheckCircle2 size={22} />} border="border-l-purple-400" bg="bg-purple-50/50" text="text-purple-600" />
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, icon, color }: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-all">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
      {icon}
    </div>
    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{value}</h3>
  </div>
);

const ActionTile = ({ title, desc, icon, onClick }: any) => (
  <button onClick={onClick} className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all text-left">
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <ArrowUpRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
    </div>
    <div className="mt-4 relative z-10">
      <h3 className="font-bold text-slate-800 dark:text-gray-100 text-lg">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{desc}</p>
    </div>
  </button>
);

const PipelineCard = ({ label, val, icon, border, bg, text }: any) => (
  <div className={`flex items-center justify-between p-6 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 border-l-4 ${border} shadow-sm transition-all hover:shadow-md`}>
     <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{val}</h3>
     </div>
     <div className={`h-12 w-12 ${bg} rounded-xl flex items-center justify-center ${text} shadow-sm`}>
        {icon}
     </div>
  </div>
);

export default Vehicles;
