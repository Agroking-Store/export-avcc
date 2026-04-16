import React, { useState, useRef, useEffect, JSX } from "react";
import { useLocation } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { logout } from "@/features/auth/authSlice";
import { useTheme } from "../../context/ThemeContext";
import {
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Car,
  Users,
  FileText,
  FileCheck,
  Truck,
  Folders,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import axios from "axios";
import { apiConfig } from "../../config/apiConfig";

// Module icons map
const moduleIcons: { [key: string]: JSX.Element } = {
  dashboard: <LayoutDashboard size={16} />,
  vehicles: <Car size={16} />,
  clients: <Users size={16} />,
  "proforma-invoice": <FileText size={16} />,
  "letter-of-credit": <FileCheck size={16} />,
  dealers: <Truck size={16} />,
  companies: <Users size={16} />,
};

/** In-memory cache: mongoId → human-readable label */
const idLabelCache: Record<string, string> = {};

/** Returns true if a URL segment looks like a MongoDB ObjectId (24 hex chars) */
const isMongoId = (segment: string) => /^[a-f\d]{24}$/i.test(segment);

/**
 * Resolves a MongoDB ObjectId to a human-readable label by checking the
 * preceding path segment to determine which API to call.
 */
const resolveIdLabel = async (
  id: string,
  segments: string[],
  idx: number
): Promise<string> => {
  if (idLabelCache[id]) return idLabelCache[id];

  const parent = idx > 0 ? segments[idx - 1] : "";

  try {
    let label = "";

    if (segments.includes("vehicles") || parent === "view") {
      // /vehicles/view/:orderId or nested vehicle routes
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      label = data.orderId || id.slice(-6);
    } else if (parent === "orders" || segments[0] === "orders") {
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      label = data.orderId || id.slice(-6);
    } else if (parent === "booking") {
      const res = await axios.get(`${apiConfig.baseURL}/orders/${id}`);
      const data = res.data.order || res.data;
      label = data.orderId || id.slice(-6);
    } else if (segments[0] === "dealers") {
      const res = await axios.get(`${apiConfig.baseURL}/dealers/${id}`);
      const data = res.data.dealer || res.data;
      label = data.name || id.slice(-6);
    } else if (segments[0] === "companies") {
      const res = await axios.get(`${apiConfig.baseURL}/companies/${id}`);
      const data = res.data.company || res.data;
      label = data.name || id.slice(-6);
    } else {
      label = id.slice(-6);
    }

    idLabelCache[id] = label;
    return label;
  } catch {
    const short = id.slice(-6);
    idLabelCache[id] = short;
    return short;
  }
};

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /** Triggers re-render once labels are resolved */
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>({});

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resolve ObjectId segments whenever the route changes
  useEffect(() => {
    const segments = location.pathname.split("/").filter((s) => s !== "");
    segments.forEach((segment, idx) => {
      if (isMongoId(segment) && !idLabelCache[segment]) {
        resolveIdLabel(segment, segments, idx).then((label) => {
          setResolvedLabels((prev) => ({ ...prev, [segment]: label }));
        });
      }
    });
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const generateBreadcrumbs = (pathname: string) => {
    const pathSegments = pathname.split("/").filter((segment) => segment !== "");
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
              {moduleIcons.dashboard}
              Main Menu
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== "/dashboard" && pathSegments.length > 0 && (
          <BreadcrumbSeparator className="[&>span]:hidden">
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
          </BreadcrumbSeparator>
        )}
      </React.Fragment>
    );

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Human-readable label: resolved API label for IDs, capitalised words otherwise
      let displayName: string;
      if (isMongoId(segment)) {
        displayName =
          resolvedLabels[segment] ||
          idLabelCache[segment] ||
          `${segment.slice(0, 6)}…`;
      } else {
        displayName = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      const icon = moduleIcons[segment] || <Folders size={16} />;
      const showIcon = !isMongoId(segment);

      breadcrumbItems.push(
        <React.Fragment key={currentPath}>
          <BreadcrumbItem>
            {isLast ? (
              <BreadcrumbPage className="px-2 py-1 rounded-md font-semibold text-gray-900 dark:text-white cursor-default flex items-center gap-1">
                {showIcon && icon}
                {displayName}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link
                  to={currentPath}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {showIcon && icon}
                  {displayName}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && (
            <BreadcrumbSeparator className="[&>span]:hidden">
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
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
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="hidden md:block">
          <SidebarTrigger />
        </div>
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
