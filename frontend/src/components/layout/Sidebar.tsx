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
    { name: "Dealers", icon: <Truck size={20} />, path: "/dealers" },
  ];

  return (
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
