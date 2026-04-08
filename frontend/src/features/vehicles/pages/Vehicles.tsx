import React, { useState, useEffect } from 'react';
import { Car, BadgeCheck, TrendingUp, Package, Truck, CheckCircle, Clock, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { vehicleApi, VehicleStats } from '../../../services/vehicleApi';
import axios from 'axios';
import { apiConfig } from '../../../config/apiConfig';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

interface Order {
  _id: string;
  orderId: string;
  status: string;
  vehicles: Array<{
    name: string;
    quantity: number;
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

  const totalOrders = orders.length;
  const totalClients = new Set(orders.map(o => o.orderId)).size;

  const statCards = [
    {
      title: 'Total Vehicles',
      value: loadingStats ? '...' : totalVehicles,
      icon: Car,
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      iconBg: 'bg-blue-400/30',
      borderColor: 'border-blue-500/20',
      description: 'All vehicles in inventory',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Available',
      value: loadingStats ? '...' : vehiclesByStatus.available,
      icon: BadgeCheck,
      gradient: 'from-emerald-500 via-green-600 to-green-700',
      iconBg: 'bg-green-400/30',
      borderColor: 'border-green-500/20',
      description: 'Ready for booking',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Booked',
      value: vehiclesByStatus.booked,
      icon: Package,
      gradient: 'from-orange-500 via-amber-600 to-orange-700',
      iconBg: 'bg-orange-400/30',
      borderColor: 'border-orange-500/20',
      description: 'Confirmed orders',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'PI Generated',
      value: vehiclesByStatus.piGenerated,
      icon: TrendingUp,
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      iconBg: 'bg-purple-400/30',
      borderColor: 'border-purple-500/20',
      description: 'Proforma invoice created',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'In Transit',
      value: vehiclesByStatus.shipped,
      icon: Truck,
      gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
      iconBg: 'bg-indigo-400/30',
      borderColor: 'border-indigo-500/20',
      description: 'Currently shipping',
      trend: '+3%',
      trendUp: true
    },
    {
      title: 'Delivered',
      value: vehiclesByStatus.delivered,
      icon: CheckCircle,
      gradient: 'from-teal-500 via-teal-600 to-teal-700',
      iconBg: 'bg-teal-400/30',
      borderColor: 'border-teal-500/20',
      description: 'Successfully delivered',
      trend: '+20%',
      trendUp: true
    }
  ];

  const ordersByMonth = [
    { month: 'Jan', orders: 12, delivered: 8 },
    { month: 'Feb', orders: 18, delivered: 14 },
    { month: 'Mar', orders: 15, delivered: 12 },
    { month: 'Apr', orders: 22, delivered: 18 },
    { month: 'May', orders: 19, delivered: 16 },
    { month: 'Jun', orders: 25, delivered: 20 }
  ];

  const statusDistribution = [
    { name: 'Available', value: vehiclesByStatus.available, color: '#10b981' },
    { name: 'Booked', value: vehiclesByStatus.booked, color: '#f59e0b' },
    { name: 'PI Generated', value: vehiclesByStatus.piGenerated, color: '#8b5cf6' },
    { name: 'In Transit', value: vehiclesByStatus.shipped, color: '#6366f1' },
    { name: 'Delivered', value: vehiclesByStatus.delivered, color: '#14b8a6' }
  ];

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Dashboard Overview</p>
                <h1 className="text-3xl font-bold text-white mb-3">Vehicle Management</h1>
                <p className="text-blue-100 max-w-xl">
                  Complete overview of your vehicle inventory, orders, and delivery tracking system
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <Car className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border ${stat.borderColor} dark:border-gray-700`}
            >
              {/* Gradient background overlay */}
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                    <Icon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <TrendIcon size={14} />
                    {stat.trend}
                  </div>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {stat.value}
                  </p>
                </div>
                
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Orders Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly order performance</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ordersByMonth}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "rgba(59,130,246,0.1)" }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#f9fafb",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorOrders)"
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Status Distribution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle status breakdown</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
              <PieChart className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
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
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#f9fafb",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-yellow-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">Pending</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Draft Orders</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{orderStats.draft}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">Active</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Confirmed Orders</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{orderStats.confirmed}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">Processing</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">PI Generated</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{orderStats.piGenerated}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Car className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Add New Vehicle</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Register a new vehicle to your inventory</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">View Orders</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check pending and completed orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Order Status Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complete breakdown of all orders</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Draft Orders', value: orderStats.draft, color: 'bg-yellow-500', icon: '📝', percentage: totalOrders > 0 ? ((orderStats.draft / totalOrders) * 100).toFixed(1) : '0' },
              { label: 'Confirmed Orders', value: orderStats.confirmed, color: 'bg-blue-500', icon: '✅', percentage: totalOrders > 0 ? ((orderStats.confirmed / totalOrders) * 100).toFixed(1) : '0' },
              { label: 'PI Generated', value: orderStats.piGenerated, color: 'bg-purple-500', icon: '📄', percentage: totalOrders > 0 ? ((orderStats.piGenerated / totalOrders) * 100).toFixed(1) : '0' },
              { label: 'Shipped', value: orderStats.shipped, color: 'bg-indigo-500', icon: '🚚', percentage: totalOrders > 0 ? ((orderStats.shipped / totalOrders) * 100).toFixed(1) : '0' },
              { label: 'Delivered', value: orderStats.delivered, color: 'bg-teal-500', icon: '📦', percentage: totalOrders > 0 ? ((orderStats.delivered / totalOrders) * 100).toFixed(1) : '0' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Quick Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Key metrics at a glance</p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Total Orders', value: totalOrders.toString(), icon: '📋', color: 'from-blue-500 to-blue-600' },
              { label: 'Active Clients', value: totalClients.toString(), icon: '👥', color: 'from-green-500 to-green-600' },
              { label: 'Available Vehicles', value: vehiclesByStatus.available.toString(), icon: '🚗', color: 'from-orange-500 to-orange-600' },
              { label: 'Total Vehicles', value: totalVehicles.toString(), icon: '🏎️', color: 'from-purple-500 to-purple-600' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl shadow-lg`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;