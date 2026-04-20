import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
} from "lucide-react";

const tabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/companies/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "companies",
    label: "Companies",
    path: "/companies/list",
    icon: Building2,
  },
];

const CompanyNavbar: React.FC = () => {
  const location = useLocation();

  return (
        <div className="flex items-center gap-1.5 w-fit">
          {tabs.map((tab) => {
        const Icon = tab.icon;
        const path = location.pathname;

        const isActive =
          (tab.key === "dashboard" &&
            path === "/companies/dashboard") ||
          (tab.key === "companies" &&
            path.startsWith("/companies") &&
            path !== "/companies/dashboard");

        return (
          <Link
            key={tab.key}
            to={tab.path}
            className={`group flex items-center gap-2.5 px-6 py-2.5 rounded-[14px] text-[14px] font-bold transition-all duration-300 whitespace-nowrap active:scale-95 cursor-pointer ${
              isActive
                ? "bg-[#1877F2] text-white shadow-md shadow-blue-200"
                : "text-slate-500 hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:shadow-sm"
            }`}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.5 : 2}
              className={`transition-all ${
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-[#1877F2]"
              }`}
            />

            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default CompanyNavbar;