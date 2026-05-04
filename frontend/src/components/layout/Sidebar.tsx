import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Car,
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useAppSelector } from "../../app/hooks";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const AppSidebar: React.FC = () => {
  const location = useLocation();

  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role?.toLowerCase();

  const isAdmin = role === "admin";
  const isAccountant = role === "accountant";

  let menuItems: MenuItem[] = [];

  // ADMIN MENU
  if (isAdmin) {
    menuItems = [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        path: "/dashboard",
      },
      {
        name: "Vehicles",
        icon: <Car size={20} />,
        path: "/vehicles",
      },
      {
        name: "Clients",
        icon: <Users size={20} />,
        path: "/clients",
      },
      {
        name: "Proforma Invoices",
        icon: <FileText size={20} />,
        path: "/proforma-invoice",
      },
      {
        name: "Dealers",
        icon: <Truck size={20} />,
        path: "/dealers",
      },
      {
        name: "Companies",
        icon: <Users size={20} />,
        path: "/companies",
      },
      {
        name: "User Management",
        icon: <ShieldCheck size={20} />,
        path: "/user-management",
      },
    ];
  }

  // ACCOUNTANT MENU
  else if (isAccountant) {
    menuItems = [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        path: "/dashboard",
      },
      {
        name: "Proforma Invoices",
        icon: <FileText size={20} />,
        path: "/proforma-invoice",
      },
    ];
  }

  // OTHER USERS
  else {
    menuItems = [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        path: "/dashboard",
      },
    ];
  }

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r flex flex-col">
      <div className="h-20 flex items-center px-6 border-b">
        <Car className="w-8 h-8 text-blue-600 mr-2" />
        <span className="font-bold text-lg">Vehicle Export</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

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