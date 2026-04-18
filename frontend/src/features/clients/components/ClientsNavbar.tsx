import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingCart } from "lucide-react";

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/clients/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "clients",
    label: "Clients",
    path: "/clients/list",
    icon: Users,
  },
  {
    key: "orders",
    label: "Orders",
    path: "/orders/list",
    icon: ShoppingCart,
  },
];

const ClientsNavbar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-[18px] w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const path = location.pathname;

        const isActive =
          (tab.key === "dashboard" && path === "/clients/dashboard") ||
          (tab.key === "clients" &&
            path.startsWith("/clients") &&
            path !== "/clients/dashboard") ||
          (tab.key === "orders" && path.startsWith("/orders"));

        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-300 whitespace-nowrap active:scale-95 ${
              isActive
                ? "bg-[#1877F2] text-white shadow-md shadow-indigo-200" 
                : "text-slate-500 hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:shadow-sm"
            }`}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? "text-white" : "text-slate-400"}
            />
            <span className="tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default ClientsNavbar;