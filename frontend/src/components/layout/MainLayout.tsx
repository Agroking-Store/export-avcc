import React from "react";
import { Outlet } from "react-router-dom";
import AppNavigationSidebar from "./AppNavigationSidebar"; // Renamed and imported
import Header from "./Header";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar"; // Import Sidebar and SidebarInset UI components
import { TooltipProvider } from "@/components/ui/tooltip";

const MainLayout: React.FC = () => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          {/* The Sidebar UI component handles both desktop and mobile (Sheet) rendering */}
          <Sidebar
            side="left"
            collapsible="icon"
            className="bg-white dark:bg-gray-900"
          >
            {" "}
            {/* Set explicit background */} {/* Use the Sidebar UI component */}
            <AppNavigationSidebar />{" "}
            {/* Pass your application's navigation sidebar as children */}
          </Sidebar>
          <SidebarInset>
            <Header />
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default MainLayout;
