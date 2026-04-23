import { ShieldCheck, List } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const UserNavbar = () => {
  const location = useLocation();

  const navItems = [
    { name: "All Users", path: "/user-management/list", icon: ShieldCheck },
  ];

  return (
    <div className="flex gap-1">
      {navItems.map((item) => {
        const isActive =
          location.pathname.includes(item.path) ||
          (item.path.includes("list") &&
            location.pathname.endsWith("user-management"));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200",
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-500 hover:bg-slate-50",
            )}
          >
            <item.icon size={18} />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
};

export default UserNavbar;
