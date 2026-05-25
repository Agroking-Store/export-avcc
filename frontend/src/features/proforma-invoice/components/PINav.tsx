import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText } from "lucide-react";

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
    // {
    //   name: "Order Perspective",
    //   icon: <ShoppingCart size={16} />,
    //   path: "/proforma-invoice/orders-list",
    // },
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
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-2 inline-flex">
    <div className="flex items-center gap-2 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = getIsActive(item.path);

        return (
          <Link
            key={item.name}
            to={item.path}
            className={`
              flex items-center gap-2.5
              px-5 py-2.5
              rounded-xl
              text-sm font-medium
              transition-all duration-200
              whitespace-nowrap
              ${
                isActive
                  ?"bg-[#1877F2] text-white shadow-md shadow-indigo-200" 
                  : "text-slate-500 hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:shadow-sm"
              }
            `}
          >
            {item.icon}
            {item.name}
          </Link>
        );
      })}
    </div>
  </div>
);
};

export default PINav;
