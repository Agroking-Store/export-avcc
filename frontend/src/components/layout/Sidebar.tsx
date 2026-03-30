import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, Users, FileText, FileCheck, Truck } from "lucide-react";
import {
  Car,
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Truck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Vehicles", icon: <Car size={20} />, path: "/vehicles" },
    { name: "Clients", icon: <Users size={20} />, path: "/clients" },
    { name: "Proforma Invoices", icon: <FileText size={20} />, path: "/proforma-invoice" },
    { name: "Letter of Credit", icon: <FileCheck size={20} />, path: "/letter-of-credit" },
    { name: "Dealers", icon: <Truck size={20} />, path: "/dealers/dashboard" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-colors duration-200">
      <div className="h-20 flex items-center px-8 border-b border-gray-50 dark:border-gray-800">
        <Car className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
        <span className="font-bold text-lg text-gray-900 dark:text-white">Vehicle Export</span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          let isActive = false;
          if (item.name === "Dealers") {
            isActive = location.pathname.startsWith('/dealers');
          } else if (item.name === "Clients") {
            isActive = location.pathname.startsWith('/clients') || location.pathname.startsWith('/orders');
          } else {
            isActive = location.pathname === item.path;
          }
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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

export default Sidebar;
    <Sidebar collapsible="icon">
      {/* Logo Area */}
      <SidebarHeader className="h-20 flex flex-row items-center px-8 border-b border-sidebar-border group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-all">
        <Car className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3 shrink-0 group-data-[collapsible=icon]:mr-0" />
        <span className="font-bold text-lg text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
          Vehicle Export
        </span>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="py-4 space-y-1">
              {menuItems.map((item) => {
                let isActive = location.pathname.includes(item.path);
                if (item.name === "Clients") {
                  isActive =
                    location.pathname.startsWith("/clients") ||
                    location.pathname.startsWith("/orders");
                }
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className="h-12 rounded-xl font-medium text-base"
                    >
                      <Link to={item.path}>
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
