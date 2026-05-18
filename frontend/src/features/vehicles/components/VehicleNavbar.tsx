import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, List, ClipboardList } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

const VehicleNavbar: React.FC = () => {
  const location = useLocation();
  const { isClient } = useAuth();
  const tabs = isClient
    ? [
        {
          key: "orders",
          label: "Required Vehicles",
          path: "/vehicles/orders",
          icon: ClipboardList,
        },
      ]
    : [
        {
          key: "dashboard",
          label: "Dashboard",
          path: "/vehicles/dashboard",
          icon: LayoutDashboard,
        },
        {
          key: "list",
          label: "Vehicle Database",
          path: "/vehicles/list",
          icon: List,
        },
        {
          key: "orders",
          label: "Vehicle List",
          path: "/vehicles/orders",
          icon: ClipboardList,
        },
      ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-[18px] w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const path = location.pathname;

        const isActive =
          (tab.key === "dashboard" && path === "/vehicles/dashboard") ||
          (tab.key === "list" &&
            (path === "/vehicles/list" || path === "/vehicles/add")) ||
          (tab.key === "orders" && path.startsWith("/vehicles/orders"));

        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={`cursor-pointer flex items-center gap-2.5 px-6 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-300 whitespace-nowrap active:scale-95 ${
              isActive
                ? "bg-[#1877F2] text-white shadow-md shadow-indigo-200" 
                : "text-slate-500 hover:text-[#005A9C] hover:bg-[#005A9C]/5"
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

export default VehicleNavbar;
