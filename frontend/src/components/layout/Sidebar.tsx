import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Car,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Truck,
} from "lucide-react";

const AppSidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    { name: "Vehicles", icon: <Car size={20} />, path: "/vehicles" },
    { name: "Clients", icon: <Users size={20} />, path: "/clients" },
    {
      name: "Proforma Invoices",
      icon: <FileText size={20} />,
      path: "/proforma-invoice",
    },
    {
      name: "Letter of Credit",
      icon: <FileCheck size={20} />,
      path: "/letter-of-credit",
    },
    { name: "Dealers", icon: <Truck size={20} />, path: "/dealers/dashboard" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r flex flex-col">
      <div className="h-20 flex items-center px-6 border-b">
        <Car className="w-8 h-8 text-blue-600 mr-2" />
        <span className="font-bold text-lg">Vehicle Export</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive =
            item.name === "Vehicles"
              ? location.pathname.startsWith("/vehicles")
              : item.name === "Dealers"
              ? location.pathname.startsWith("/dealers")
              : item.name === "Clients"
              ? location.pathname.startsWith("/clients") ||
                location.pathname.startsWith("/orders")
              : location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AppSidebar;
