import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  ShoppingCart,
  CheckCircle2,
  FileText,
  TrendingUp,
  Clock3,
  UserPlus,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";

const ClientsDashboard = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [clientsRes, ordersRes] = await Promise.all([
        axios.get(`${apiConfig.baseURL}/clients?limit=1000`),
        axios.get(`${apiConfig.baseURL}/orders?limit=1000`),
      ]);

      setClients(clientsRes.data.data || clientsRes.data || []);
      setOrders(ordersRes.data.data || ordersRes.data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: any) => {
    if (!clientId) return "Unknown Client";

    if (typeof clientId === "object") {
      return clientId.name || "Unknown Client";
    }

    const found = clients.find((c) => c._id === clientId);
    return found?.name || "Unknown Client";
  };

  const getClientCountry = (clientId: any) => {
    if (!clientId) return "-";

    if (typeof clientId === "object") {
      return clientId.country || "-";
    }

    const found = clients.find((c) => c._id === clientId);
    return found?.country || "-";
  };

  const stats = useMemo(() => {
    return {
      totalClients: clients.length,
      totalOrders: orders.length,
      confirmedOrders: orders.filter(
        (o) => o.status === "Confirmed"
      ).length,
      draftOrders: orders.filter(
        (o) => o.status === "Draft"
      ).length,
      thisMonthOrders: orders.filter((o) => {
        const d = new Date(o.date);
        const now = new Date();

        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length,
    };
  }, [clients, orders]);

  const topClients = useMemo(() => {
    const map: any = {};

    orders.forEach((order) => {
      const id =
        typeof order.clientId === "object"
          ? order.clientId?._id
          : order.clientId;

      if (!map[id]) {
        map[id] = {
          name: getClientName(order.clientId),
          country: getClientCountry(order.clientId),
          count: 0,
        };
      }

      map[id].count += 1;
    });

    return Object.values(map)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }, [orders, clients]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <div className="w-full p-8 space-y-8">
        {/* Skeleton Header */}
        <div className="rounded-3xl bg-white border p-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded mb-3"></div>
          <div className="h-4 w-80 bg-slate-100 rounded"></div>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((item) => (
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
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Clients Dashboard
          </h1>

          <p className="text-[15px] text-slate-500 font-medium mt-1">
            Manage clients and track orders efficiently.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart size={20} />}
          color="bg-indigo-50 text-indigo-600"
        />

        <StatCard
          title="Confirmed"
          value={stats.confirmedOrders}
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Draft"
          value={stats.draftOrders}
          icon={<FileText size={20} />}
          color="bg-amber-50 text-amber-500"
        />

        <StatCard
          title="This Month"
          value={stats.thisMonthOrders}
          icon={<TrendingUp size={20} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Add Client"
          subtitle="Create new client profile"
          icon={<UserPlus size={20} />}
          onClick={() => navigate("/clients/add")}
        />

        <ActionCard
          title="Create Order"
          subtitle="Generate new order"
          icon={<PlusCircle size={20} />}
          onClick={() => navigate("/orders/add")}
        />
      </div>

      {/* DATA SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* TOP CLIENTS */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Users
                size={18}
                className="text-slate-500"
              />
            </div>

            <h2 className="font-bold text-slate-800 text-lg">
              Top Clients
            </h2>
          </div>

          <div className="space-y-4">
            {topClients.length === 0 ? (
              <Empty text="No top clients found" />
            ) : (
              topClients.map((client: any, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 px-5 py-4 hover:border-blue-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {client.name}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {client.country}
                    </p>
                  </div>

                  <span className="px-4 py-1.5 rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                    {client.count} Orders
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Clock3
                size={18}
                className="text-slate-500"
              />
            </div>

            <h2 className="font-bold text-slate-800 text-lg">
              Recent Orders
            </h2>
          </div>

          {recentOrders.length === 0 ? (
            <Empty text="No recent orders found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Client</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map(
                    (order: any, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/50 transition-all"
                      >
                        <td className="py-4 font-bold text-slate-700">
                          {order.orderId || "-"}
                        </td>

                        <td className="py-4 text-slate-600 font-medium">
                          {getClientName(
                            order.clientId
                          )}
                        </td>

                        <td className="py-4">
                          <StatusBadge
                            status={order.status}
                          />
                        </td>

                        <td className="py-4 text-slate-500 text-right text-sm">
                          {order.date
                            ? new Date(
                                order.date
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
    >
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

const ActionCard = ({
  title,
  subtitle,
  icon,
  onClick,
}: any) => (
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
      <h3 className="font-bold text-slate-800 text-lg">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>
  </button>
);

const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const isConfirmed =
    status === "Confirmed";

  return (
    <span
      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
        isConfirmed
          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
          : "bg-amber-50 text-amber-600 border border-amber-100"
      }`}
    >
      {status || "Draft"}
    </span>
  );
};

const Empty = ({
  text,
}: {
  text: string;
}) => (
  <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
    {text}
  </div>
);

export default ClientsDashboard;