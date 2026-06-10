import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Car,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Truck,
  Ship,
} from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarGroup,
} from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const AppNavigationSidebar: React.FC = () => {
  const location = useLocation();
  const { user, isSourcingTeam, isClient } = useAuth();

  const role = user?.role?.toLowerCase();
  const isPathActive = (prefixes: string[]) =>
    prefixes.some(
      (prefix) =>
        location.pathname === prefix ||
        location.pathname.startsWith(`${prefix}/`),
    );

  const defaultMenuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      activePaths: ["/dashboard"],
    },
    {
      name: "Vehicles",
      icon: <Car size={20} />,
      path: "/vehicles",
      activePaths: ["/vehicles"],
    },
    {
      name: "Clients",
      icon: <Users size={20} />,
      path: "/clients",
      activePaths: ["/clients", "/orders"],
    },
    {
      name: "Proforma Invoices",
      icon: <FileText size={20} />,
      path: "/proforma-invoice",
      activePaths: [
        "/proforma-invoice",
        "/invoices/generate",
        "/packing-list/generate",
      ],
    },
    {
      name: "Dealers",
      icon: <Truck size={20} />,
      path: "/dealers/dashboard",
      activePaths: ["/dealers"],
    },
    {
      name: "Companies",
      icon: <Users size={20} />,
      path: "/companies",
      activePaths: ["/companies"],
    },
    {
      name: "Shipment Plan",
      icon: <Ship size={20} />,
      path: "/shipment-planning/dashboard",
      activePaths: ["/shipment-planning"],
    },
  ];

  let menuItems =
    role === "client"
      ? [
          {
            name: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/dashboard",
            activePaths: ["/dashboard"],
          },
          {
            name: "Vehicles",
            icon: <Car size={20} />,
            path: "/vehicles",
            activePaths: ["/vehicles"],
          },
          {
            name: "Shipment Plan",
            icon: <Ship size={20} />,
            path: "/shipment-planning/dashboard",
            activePaths: ["/shipment-planning"],
          },
          // Document Explorer removed from client menu
        ]
      : role === "accountant"
      ? [
          {
            name: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/dashboard",
            activePaths: ["/dashboard"],
          },
          {
            name: "Proforma Invoices",
            icon: <FileText size={20} />,
            path: "/proforma-invoice",
            activePaths: [
              "/proforma-invoice",
              "/invoices/generate",
              "/packing-list/generate",
            ],
          },
        ]
      : [...defaultMenuItems];

  if (role === "admin") {
    menuItems.push({
      name: "User Management",
      icon: <ShieldCheck size={20} />,
      path: "/user-management",
      activePaths: ["/user-management"],
    });
    
    // Add Document Explorer only for admin
    menuItems.push({
      name: "Document Explorer",
      icon: <FileCheck size={20} />,
      path: "/document-explorer",
      activePaths: ["/document-explorer"],
    });
  }

  // Filter menu items based on user role
  const visibleMenuItems = (() => {
    // For client role - Document Explorer is already removed from their menu
    if (isClient) {
      return menuItems;
    }
    
    // For sourcing team - show only Vehicles and Dealers (no Document Explorer)
    if (isSourcingTeam) {
      return menuItems.filter(
        (item) =>
          item.name === "Vehicles" ||
          item.name === "Dealers",
      );
    }
    
    // For other roles (admin, accountant, etc.)
    return menuItems;
  })();

  return (
    <>
      {/* Header section with logo and title, now fully styled to match previous design */}
      <SidebarHeader className="h-16 border-b-2 border-gray-200 dark:border-gray-950 shadow-md flex items-center px-6 group-data-[collapsible=icon]:px-2 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-blue-600 mr-0 shrink-0" />
          <span className="font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            Vehicle Export
          </span>
        </div>
      </SidebarHeader>
      
      {/* Main content area for navigation links */}
      <SidebarContent className="flex-1 py-4 bg-white dark:bg-gray-900">
        <SidebarGroup>
          <SidebarMenu className="flex flex-col gap-2">
            {visibleMenuItems.map((item) => {
              const isActive = isPathActive(item.activePaths || [item.path]);

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive}
                    tooltip={item.name}
                    className={cn(
                      "p-6 text-lg transition-colors rounded-lg",
                      isActive
                        ? "bg-blue-700 text-white dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700 rounded-4xl"
                        : "text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 dark:border-gray-700 rounded-4xl",
                    )}
                  >
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 text-base [&>svg]:size-6 group-data-[collapsible=icon]:[&>svg]:size-5"
                    >
                      {item.icon}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
};

export default AppNavigationSidebar;