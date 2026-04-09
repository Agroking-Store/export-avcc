import React, { useState, useRef, useEffect, JSX } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { logout } from "@/features/auth/authSlice"; // Using alias for consistency
import { useTheme } from "../../context/ThemeContext";
import {
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Car, // Added for module icons
  Users, // Added for module icons
  FileText, // Added for module icons
  FileCheck, // Added for module icons
  Truck, // Added for module icons
  Folders, // Added for default breadcrumb icon
} from "lucide-react"; // Added ChevronRight and LayoutDashboard
import { SidebarTrigger } from "@/components/ui/sidebar"; // Assuming SidebarTrigger is for mobile sheet
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbList, // Import BreadcrumbList
} from "@/components/ui/breadcrumb"; // Assuming shadcn breadcrumb components

// Define module icons outside to avoid re-creation on every render
const moduleIcons: { [key: string]: JSX.Element } = {
  dashboard: <LayoutDashboard size={16} />,
  vehicles: <Car size={16} />,
  clients: <Users size={16} />,
  "proforma-invoice": <FileText size={16} />,
  "letter-of-credit": <FileCheck size={16} />,
  dealers: <Truck size={16} />,
  companies: <Users size={16} />,
  // Add more as needed for other modules
};

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const generateBreadcrumbs = (pathname: string) => {
    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "");
    let currentPath = "";
    const breadcrumbItems: JSX.Element[] = [];

    // Always start with Main Menu
    breadcrumbItems.push(
      <React.Fragment key="/dashboard">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {moduleIcons.dashboard} {/* Use the icon for Main Menu */}
              Main Menu
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== "/dashboard" && pathSegments.length > 0 && (
          <BreadcrumbSeparator className="[&>span]:hidden">
            {" "}
            {/* Added className to hide default span content */}
            <ChevronRight
              size={16}
              className="text-gray-400 dark:text-gray-600"
            />
          </BreadcrumbSeparator>
        )}
      </React.Fragment>
    );

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Simple capitalization for display
      const displayName = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const icon = moduleIcons[segment] || <Folders size={16} />; // Get icon for the segment, or use a default File icon

      breadcrumbItems.push(
        <React.Fragment key={currentPath}>
          <BreadcrumbItem>
            {isLast ? (
              <BreadcrumbPage className="px-2 py-1 rounded-md font-semibold text-gray-900 dark:text-white cursor-default flex items-center gap-1">
                {icon}
                {displayName}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link
                  to={currentPath}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {icon}
                  {displayName}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && (
            <BreadcrumbSeparator className="[&>span]:hidden">
              {" "}
              {/* Added className to hide default span content */}
              <ChevronRight
                size={16}
                className="text-gray-400 dark:text-gray-600"
              />
            </BreadcrumbSeparator>
          )}
        </React.Fragment>
      );
    });

    return breadcrumbItems;
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 transition-colors duration-200 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Sidebar trigger for mobile views */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        {/* Sidebar trigger for desktop views */}
        <div className="hidden md:block">
          <SidebarTrigger />
        </div>
        {/* Wrapper for breadcrumbs to ensure it takes available space and handles overflow */}
        <div className="flex-1 min-w-0">
          <Breadcrumb className="py-2 px-2 min-w-0 text-base">
            <BreadcrumbList className="flex items-center text-lg space-x-2 flex-nowrap overflow-x-auto list-none">
              {generateBreadcrumbs(location.pathname)}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
          <Bell size={20} />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 ml-2 border border-blue-200 dark:border-blue-800 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <User size={20} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in py-1">
              <Link
                to="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <User size={16} />
                My Profile
              </Link>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
