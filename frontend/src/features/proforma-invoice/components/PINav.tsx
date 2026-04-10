import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ShoppingCart } from "lucide-react";

const PINav = () => {
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={16} />,
      path: "/proforma-invoice/dashboard",
    },
    {
      name: "PI Perspective",
      icon: <FileText size={16} />,
      path: "/proforma-invoice/list",
    },
    {
      name: "Order Perspective",
      icon: <ShoppingCart size={16} />,
      path: "/proforma-invoice/orders-list",
    },
  ];

  const getIsActive = (itemPath: string) => {
    const currentPath = location.pathname;

    if (itemPath === "/proforma-invoice/dashboard") {
      return currentPath === "/proforma-invoice/dashboard";
    }
    if (itemPath === "/proforma-invoice/list") {
      // This tab should be active for list, add, edit, and details pages
      return (
        currentPath.startsWith("/proforma-invoice") &&
        !currentPath.startsWith("/proforma-invoice/dashboard") &&
        !currentPath.startsWith("/proforma-invoice/orders")
      );
    }
    if (itemPath === "/proforma-invoice/orders-list") {
      return currentPath.startsWith("/proforma-invoice/orders");
    }
    return false;
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-1.5">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${
              getIsActive(item.path)
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60"
            }`}
          >
            {item.icon}
            {item.name}
            {getIsActive(item.path) && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PINav;
