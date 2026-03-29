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
    path:"/orders/list",
    icon: ShoppingCart,
  },
];

const ClientsNavbar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur 
                border border-gray-200 dark:border-slate-700 
                rounded-xl shadow-sm p-1.5">
  <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-2 px-2">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const path = location.pathname;

      const isActive =
        (tab.key === "dashboard" && path === "/clients/dashboard") ||
        (tab.key === "clients" &&
          path.startsWith("/clients") &&
          path !== "/clients/dashboard") ||
        (tab.key === "orders" &&
          path.startsWith("/orders"));

      return (
        <Link
          key={tab.key}
          to={tab.path}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60"
          }`}
        >
          <Icon
            size={18}
            className={
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-gray-400"
            }
          />

          <span className="hidden sm:inline">{tab.label}</span>

          {isActive && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </Link>
      );
    })}
  </div>
</div>
  );
};

export default ClientsNavbar;