import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth"; // ✅ Import your hook

const ShipmentPlanningNavbar: React.FC = () => {
  const location = useLocation();
  const { isClient } = useAuth(); // ✅ Get the client role check

  const tabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      path: "/shipment-planning/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      key: "shipments",
      label: "Shipment Details",
      path: "/shipment-planning/list",
      icon: <Package size={18} />,
    },


  ];

  // FILTER: Remove the dashboard tab if the logged-in user is a client
  const visibleTabs = tabs.filter((tab) => {
    if (tab.key === "dashboard" && isClient) {
      return false;
    }
    return true;
  });

  const isActiveTab = (tabKey: string) => {
    const p = location.pathname;
    if (tabKey === "dashboard") return p === "/shipment-planning/dashboard";
    if (tabKey === "shipments")
      return (
        p.startsWith("/shipment-planning/list") ||
        p.startsWith("/shipment-planning/add") ||
        p.startsWith("/shipment-planning/view")
      );

    return false;
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-50/50 rounded-[18px] w-fit">
      {/* Map over visibleTabs instead of tabs */}
      {visibleTabs.map((tab) => {
        const isActive = isActiveTab(tab.key);
        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={`cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-300 whitespace-nowrap active:scale-95 ${
              isActive
                ? "bg-[#1877F2] text-white shadow-md shadow-indigo-200"
                : "text-slate-500 hover:text-[#005A9C] hover:bg-[#005A9C]/5"
            }`}
          >
            <div className={isActive ? "text-white" : "text-slate-400"}>
              {tab.icon}
            </div>
            <span className="tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default ShipmentPlanningNavbar;
