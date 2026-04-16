import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, FileText } from "lucide-react";

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dealers/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "dealers",
    label: "Dealers",
    path: "/dealers/list",
    icon: Store,
  },
  {
    key: "orders",
    label: "Orders",
    path: "/dealers/orders",
    icon: FileText,
  },
];

const DealersNavbar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-[18px] w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const path = location.pathname;

        const isActive =
          (tab.key === "dashboard" && path === "/dealers/dashboard") ||
          (tab.key === "dealers" &&
            path.startsWith("/dealers") &&
            !path.startsWith("/dealers/dashboard") &&
            !path.startsWith("/dealers/orders") &&
            !path.startsWith("/dealers/booking")) ||
          (tab.key === "orders" && (path.startsWith("/dealers/orders") || path.startsWith("/dealers/booking")));

        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-300 whitespace-nowrap active:scale-95 ${isActive
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

export default DealersNavbar;
