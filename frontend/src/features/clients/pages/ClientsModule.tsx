import { Users } from "lucide-react";
import ClientsNavbar from "../components/ClientsNavbar";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import ClientsDashboard from "./ClientsDashboard";
import ClientsList from "./ClientsList";
import AddClient from "./AddClient";
import EditClient from "./EditClient";
import ClientDetails from "./ClientDetails";

const ClientsModule = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER CARD - Compact & Light Blue */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          
          {/* Icon Box: Scaled down from w-16 to w-14 */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          
          <div>
            {/* Title: Scaled down to text-2xl */}
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              Clients 
            </h1>
            {/* Subtitle: Scaled down to text-sm */}
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Manage clients
            </p>
          </div>
        </div>

        {/* NAVBAR (Floating Style) */}
        <div className="inline-flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <ClientsNavbar />
        </div>

        {/* CONTENT AREA */}
        <div className="mt-5">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientsDashboard />} />
            <Route path="list" element={<ClientsList />} />
            <Route path="add" element={<AddClient />} />
            <Route path="edit/:id" element={<EditClient />} />
            <Route path=":id" element={<ClientDetails />} />
            <Route path="*" element={<Navigate to="/clients/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ClientsModule;