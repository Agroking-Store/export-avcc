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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900">
      <div className="px-6 py-5">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Clients Module
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-300">
              Manage clients and orders
            </p>
          </div>
        </div>

        {/* ✅ NAVBAR*/}
        <div className="mt-2">
          <ClientsNavbar />
        </div>

         <div className="mt-6">
        <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
          {/* DASHBOARD */}
          <Route path="dashboard" element={<ClientsDashboard />} />
        
          {/* CLIENTS */}
          <Route path="list" element={<ClientsList />} />
          <Route path="add" element={<AddClient />} />
          <Route path="edit/:id" element={<EditClient />} />
          <Route path=":id" element={<ClientDetails />} />
        
          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/clients/dashboard" replace />} />
        
        </Routes>
      </div>
      </div>
    </div>
  );
};

export default ClientsModule;