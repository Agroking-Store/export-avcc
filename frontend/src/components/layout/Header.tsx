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
import { invoiceApi } from "@/features/proforma-invoice/components/invoiceApi";

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
const isMongoId = (segment: string) =>
  /^[a-f\d]{24}$/i.test(segment) && isNaN(Number(segment));

const formatBreadcrumbLabel = (segment: string, resolvedLabel?: string) => {
  if (resolvedLabel && resolvedLabel.trim()) {
    return resolvedLabel.length > 24
      ? `${resolvedLabel.slice(0, 21)}...`
      : resolvedLabel;
  }

  if (isMongoId(segment)) {
    return `ID ${segment.slice(-6)}`;
  }

  const pretty = segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (pretty.length > 24 && /[\d_]/.test(segment)) {
    return `${pretty.slice(0, 21)}...`;
  }

  return pretty;
};

const prettyInvoiceType = (segment: string) => {
  const normalized = segment.toUpperCase();
  if (normalized === "COMMERCIAL") return "Commercial";
  if (normalized === "USD") return "USD";
  if (normalized === "INR") return "INR";
  return formatBreadcrumbLabel(segment);
};

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

    if (
      (segments[0] === "invoices" && segments[1] === "generate" && idx === 2) ||
      (segments[0] === "packing-list" && segments[1] === "generate" && idx === 2) ||
      (segments[0] === "proforma-invoice" &&
        (idx === 1 || parent === "edit" || parent === "create-tax-invoice"))
    ) {
      const context = await invoiceApi.getPIContext(id);
      label = context.piNumber || `PI ${id.slice(-6)}`;
    } else if (
      segments[0] === "invoices" &&
      segments[1] === "generate" &&
      idx === 4 &&
      segments[2]
    ) {
      const context = await invoiceApi.getPIContext(segments[2]);
      const vehicle = context.vehicles.find((item) => item.vehicleId === id);
      label =
        vehicle?.displayModel ||
        vehicle?.chassisNo ||
        `Vehicle ${id.slice(-6)}`;
    } else if (segments.includes("vehicles") || parent === "view") {
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

  const buildBreadcrumbEntries = (pathname: string) => {
    const segments = pathname.split("/").filter(Boolean);

    if (
      segments[0] === "invoices" &&
      segments[1] === "generate" &&
      segments[2] &&
      segments[3]
    ) {
      const piId = segments[2];
      const type = segments[3];
      const vehicleId = segments[4];
      const piLabel =
        resolvedLabels[piId] || idLabelCache[piId] || `PI ${piId.slice(-6)}`;
      const typeLabel = `${prettyInvoiceType(type)} Invoice`;

      return [
        {
          label: "Proforma Invoice",
          to: "/proforma-invoice/list",
          icon: moduleIcons["proforma-invoice"],
        },
        {
          label: piLabel,
          to: `/proforma-invoice/${piId}`,
          icon: moduleIcons["proforma-invoice"],
        },
        vehicleId
          ? {
              label: `Select Vehicle for ${typeLabel}`,
              to: `/invoices/generate/${piId}/${type}`,
              icon: <Car size={16} />,
            }
          : {
              label: `Select Vehicle for ${typeLabel}`,
              icon: <Car size={16} />,
            },
        vehicleId
          ? {
              label:
                resolvedLabels[vehicleId] ||
                idLabelCache[vehicleId] ||
                "Fill Details",
              icon: <FileText size={16} />,
            }
          : null,
      ].filter(Boolean) as Array<{
        label: string;
        to?: string;
        icon?: JSX.Element;
      }>;
    }

    if (
      segments[0] === "packing-list" &&
      segments[1] === "generate" &&
      segments[2]
    ) {
      const piId = segments[2];
      const piLabel =
        resolvedLabels[piId] || idLabelCache[piId] || `PI ${piId.slice(-6)}`;

      return [
        {
          label: "Proforma Invoice",
          to: "/proforma-invoice/list",
          icon: moduleIcons["proforma-invoice"],
        },
        {
          label: piLabel,
          to: `/proforma-invoice/${piId}`,
          icon: moduleIcons["proforma-invoice"],
        },
        {
          label: "Generate Packing List",
          icon: <Truck size={16} />,
        },
      ];
    }

    return segments.map((segment, index) => {
      const currentPath = `/${segments.slice(0, index + 1).join("/")}`;
      const isMongoSegment = isMongoId(segment);

      return {
        label: formatBreadcrumbLabel(
          segment,
          resolvedLabels[segment] || idLabelCache[segment]
        ),
        to: index === segments.length - 1 ? undefined : currentPath,
        icon: isMongoSegment ? undefined : moduleIcons[segment] || <Folders size={16} />,
      };
    });
  };

  const generateBreadcrumbs = (pathname: string) => {
    const pathSegments = pathname.split("/").filter((segment) => segment !== "");
    const breadcrumbItems: JSX.Element[] = [];
    const entries = buildBreadcrumbEntries(pathname);

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

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;

      breadcrumbItems.push(
        <React.Fragment key={`${entry.to || entry.label}-${index}`}>
          <BreadcrumbItem>
            {isLast || !entry.to ? (
              <BreadcrumbPage className="max-w-[220px] truncate px-2 py-1 rounded-md font-semibold text-gray-900 dark:text-white cursor-default flex items-center gap-1">
                {entry.icon}
                {entry.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link
                  to={entry.to}
                  className="max-w-[220px] truncate flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {entry.icon}
                  {entry.label}
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
            <BreadcrumbList className="flex items-center text-lg space-x-2 flex-nowrap overflow-x-auto list-none max-w-[58vw]">
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
