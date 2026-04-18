import { apiConfig } from "@/config/apiConfig";
import ClientsTable from "@/features/clients/components/ClientsTable";
import VehiclesTable from "@/features/vehicles/components/VehiclesTable";
import { AlertTriangle } from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart2,
  Crown,
  LayoutDashboard,
  PieChart as PieChartIcon,
} from "lucide-react";

import {
  Search,
  Bell,
  DollarSign,
  TrendingUp,
  Truck,
  Eye,
  Download,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const data = [
  { name: "Total Orders", value: 12 },
  { name: "Vehicles Exported", value: 50 },
  { name: "Confirmed Orders", value: 8 },
  { name: "Total Clients", value: 2 },
];

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

const shipmentData = [
  { month: "Jan", shipments: 20 },
  { month: "Feb", shipments: 35 },
  { month: "Mar", shipments: 28 },
  { month: "Apr", shipments: 45 },
  { month: "May", shipments: 30 },
  { month: "Jun", shipments: 50 },
];
const colorStyles = {
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    bar: "bg-indigo-500",
    ring: "ring-indigo-100",
    cardBg: "bg-gradient-to-br from-white to-indigo-50/40",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    bar: "bg-green-500",
    ring: "ring-green-100",
    cardBg: "bg-gradient-to-br from-white to-green-50/40",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    bar: "bg-blue-500",
    ring: "ring-blue-100",
    cardBg: "bg-gradient-to-br from-white to-blue-50/40",
  },
};
const modules = ["Booked Vehicles", "Clients"];

const Dashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<
    "Booked Vehicles" | "Clients"
  >("Booked Vehicles");

  const renderModuleContent = () => {
    switch (activeModule) {
      case "Booked Vehicles":
        return <VehiclesTable />;
      case "Clients":
        return <ClientsTable />;
      default:
        return <VehiclesTable />;
    }
  };
  //

  return (
    <div className="p-6 bg-gradient-to-br  min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 px-8 py-7 rounded-2xl border-none bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-[0_6px_20px_rgba(0,0,0,0.15)]">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* ICON */}
          <div className="p-2.5 rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
            <LayoutDashboard size={20} className="text-indigo-600" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Export Overview
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              Manage shipments, orders and export activity
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Balance",
            value: "$56,874",
            icon: <DollarSign size={20} />,
            color: "indigo",
            change: "+4.2%",
          },
          {
            title: "Total Sales",
            value: "$24,575",
            icon: <TrendingUp size={20} />,
            color: "green",
            change: "+2.3%",
          },
          {
            title: "Vehicles Exported",
            value: "50",
            icon: <Truck size={20} />,
            color: "blue",
            change: "+8%",
          },
        ].map((card, i) => {
          const style = colorStyles[card.color as keyof typeof colorStyles];

          return (
            <div
              key={i}
              className={`relative p-6 rounded-2xl border overflow-hidden
      shadow-[0_4px_20px_rgba(0,0,0,0.04)]
      hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]
      hover:-translate-y-1 transition-all duration-300 group
      ${style.cardBg}`}
            >
              {/* TOP */}
              <div className="flex justify-between items-start relative z-10">
                {/* ICON */}
                <div
                  className={`p-3 rounded-xl ${style.bg} ${style.text} ring-4 ${style.ring} shadow-sm`}
                >
                  {card.icon}
                </div>

                {/* CHANGE BADGE */}
                <span className="text-xs font-semibold text-green-600 bg-green-100/80 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <TrendingUp size={12} /> {card.change}
                </span>
              </div>

              {/* VALUE */}
              <h2 className="text-3xl font-bold text-gray-900 mt-5 tracking-tight">
                {card.value}
              </h2>

              <p className="text-sm text-gray-500 mt-1">{card.title}</p>

              {/* PROGRESS BAR */}
              <div className="mt-5 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${style.bar} w-2/3 rounded-full transition-all duration-700`}
                />
              </div>

              {/* BOTTOM FADE LINE */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60" />
            </div>
          );
        })}

        {/* PENDING ACTIONS CARD - FINAL */}
        <div className="relative bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition flex flex-col justify-between h-full">
          {/* ICON */}
          <div className="absolute top-4 right-4 p-2 rounded-lg bg-orange-50 shadow-sm">
            <AlertTriangle size={20} className="text-orange-500" />
          </div>

          <div>
            <p className="text-sm text-gray-500">Pending Actions</p>

            <h2 className="text-lg font-semibold mt-1.5 text-gray-800">
              Operational Alerts
            </h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center pr-1">
                <span className="text-gray-600">Orders Pending</span>
                <span className="font-semibold text-orange-500">3</span>
              </div>

              <div className="flex justify-between items-center pr-1">
                <span className="text-gray-600">Invoices Missing</span>
                <span className="font-semibold text-yellow-500">2</span>
              </div>

              <div className="flex justify-between items-center pr-1">
                <span className="text-gray-600">Vehicles Not Shipped</span>
                <span className="font-semibold text-blue-500">5</span>
              </div>
            </div>
          </div>

          <button className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition">
            View Details →
          </button>
        </div>
      </div>
      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* BAR CHART */}
        <div className="lg:col-span-2 relative bg-gradient-to-br from-white to-indigo-50/30 p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          {/* TOP */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                <BarChart2 size={22} className="text-indigo-600" />
              </div>

              <h3 className="font-semibold text-gray-800">
                Shipment Statistics
              </h3>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition outline-none cursor-pointer">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>

          {/* CHART */}
          <div className="rounded-xl bg-white/60 backdrop-blur p-3 ">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={shipmentData}>
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="shipments" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="relative bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          {/* TOP */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 ring-1 ring-purple-100">
              <PieChartIcon size={21} className="text-purple-600" />
            </div>

            <h3 className="font-semibold text-gray-800">Order Distribution</h3>
          </div>

          {/* CHART */}
          <div className="rounded-xl bg-white/60 backdrop-blur p-3 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition"
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* ✅ Custom Legend (outside chart) */}
            <div className="mt-3 flex flex-wrap gap-3 justify-center">
              {data.map((_entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="text-gray-700">
                    {_entry.name} : {_entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-2xl shadow-sm mb-8 border border-gray-200 overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/60">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Recent Orders
          </h3>

          <button className="text-sm text-indigo-600 font-medium hover:underline">
            View All
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-6 py-3">Order ID</th>
              <th className="text-left px-6 py-3">Client</th>
              <th className="text-left px-6 py-3">Vehicle</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {[
              {
                id: "#1023",
                client: "ABC Traders",
                vehicle: "Toyota Land Cruiser",
                status: "Completed",
                color: "green",
              },
              {
                id: "#1022",
                client: "Global Motors",
                vehicle: "BMW X5",
                status: "Processing",
                color: "yellow",
              },
              {
                id: "#1021",
                client: "Dubai Imports",
                vehicle: "Mercedes G Wagon",
                status: "Shipped",
                color: "blue",
              },
            ].map((order, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50/70 transition duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {order.id}
                </td>

                <td className="px-6 py-4 text-gray-600">{order.client}</td>

                <td className="px-6 py-4 text-gray-600">{order.vehicle}</td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <span
                    className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full text-xs font-medium bg-${order.color}-100 text-${order.color}-700`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full bg-${order.color}-500`}
                    ></span>
                    {order.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-gray-500">10 Apr 2026</td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <div className="p-2 rounded-lg hover:bg-indigo-50 transition">
                      <Eye
                        size={16}
                        className="text-gray-500 hover:text-indigo-600"
                      />
                    </div>

                    <div className="p-2 rounded-lg hover:bg-green-50 transition">
                      <Download
                        size={16}
                        className="text-gray-500 hover:text-green-600"
                      />
                    </div>

                    <div className="p-2 rounded-lg hover:bg-gray-100 transition">
                      <MoreVertical
                        size={16}
                        className="text-gray-500 hover:text-gray-700"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SHIPMENT ACTIVITY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-6">Shipment Activity</h3>

        <div className="flex gap-6 border-b mb-6 overflow-x-auto">
          {modules.map((mod) => (
            <button
              key={mod}
              onClick={() =>
                setActiveModule(mod as "Clients" | "Booked Vehicles")
              }
              className={`pb-2 text-sm whitespace-nowrap transition cursor-pointer ${
                activeModule === mod
                  ? "border-b-2 border-indigo-600 text-indigo-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 p-5 rounded-lg min-h-[120px] hover:shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderModuleContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
