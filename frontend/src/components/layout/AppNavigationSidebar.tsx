import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Car,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Truck,
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

const AppNavigationSidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    { name: "Vehicles", icon: <Car size={20} />, path: "/vehicles" },
    { name: "Clients", icon: <Users size={20} />, path: "/clients" },
    {
      name: "Proforma Invoices",
      icon: <FileText size={20} />,
      path: "/proforma-invoice",
    },
    {
      name: "Letter of Credit",
      icon: <FileCheck size={20} />,
      path: "/letter-of-credit",
    },
    { name: "Dealers", icon: <Truck size={20} />, path: "/dealers/dashboard" },
    { name: "Companies", icon: <Users size={20} />, path: "/companies" },
  ];

  return (
    <>
      {/* Header section with logo and title, now fully styled to match previous design */}
      <SidebarHeader className="h-16 border-b-2 border-gray-200 dark:border-gray-950 shadow-md flex items-center px-6 group-data-[collapsible=icon]:px-2 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {" "}
          {/* Use gap-3 as in original for consistency */}
          <Car className="w-8 h-8 text-blue-600 mr-0 shrink-0" />{" "}
          {/* Keep w-8 h-8, remove mr-2 if gap-3 handles it */}
          <span className="font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            Vehicle Export
          </span>
        </div>
      </SidebarHeader>
      {/* Main content area for navigation links */}
      <SidebarContent className="flex-1 py-4 bg-white dark:bg-gray-900">
        {" "}
        {/* Apply px-6 here for consistent left padding */}{" "}
        {/* flex-1 and p-4 match original nav */}
        <SidebarGroup>
          {" "}
          {/* SidebarGroup has a default p-2, so p-4 on SidebarContent will handle overall padding */}
          <SidebarMenu className="flex flex-col gap-2">
            {" "}
            {/* gap-2 for vertical spacing between menu items */}
            {menuItems.map((item) => {
              const isActive =
                item.name === "Vehicles"
                  ? location.pathname.startsWith("/vehicles")
                  : item.name === "Dealers"
                  ? location.pathname.startsWith("/dealers")
                  : item.name === "Clients"
                  ? location.pathname.startsWith("/clients") ||
                    location.pathname.startsWith("/orders")
                  : item.name === "Companies"
                  ? location.pathname.startsWith("/companies")
                  : location.pathname === item.path;

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    size="lg" // Make the tile bigger (h-12)
                    isActive={isActive}
                    tooltip={item.name}
                    className={cn(
                      "p-6 text-lg transition-colors rounded-lg", // Increase padding, add smooth color transitions, and rounded border
                      isActive
                        ? "bg-blue-200 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 rounded-4xl" // Apply darker active state styles with darker blue border
                        : "text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 dark:border-gray-700 rounded-4xl" // Default/hover state styles
                    )}
                  >
                    <Link
                      to={item.path}
                      // Apply responsive icon sizing and text size
                      className="flex items-center gap-3 text-base [&>svg]:size-6 group-data-[collapsible=icon]:[&>svg]:size-5"
                    >
                      {item.icon}{" "}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.name}
                      </span>{" "}
                      {/* Hide text on collapse */}
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
