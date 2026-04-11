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
    /* Removed the bg-white, border, shadow, and p-1.5 from here */
    <div className="flex items-center gap-1">
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[15px] font-medium transition-all duration-200 whitespace-nowrap ${
              isActive
                ? "bg-gradient-to-r from-[#00b4d8] to-[#2b67f6] text-white shadow-md shadow-blue-100"
                : "text-[#334155] hover:bg-[#eff6ff] hover:text-[#2563eb] dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
            }`}
          >
            <Icon
              size={19}
              strokeWidth={isActive ? 2.5 : 2}
              className={isActive ? "text-white" : "text-slate-500"}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default ClientsNavbar;