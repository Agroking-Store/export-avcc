import { Routes, Route, Navigate } from "react-router-dom";
import { Users } from "lucide-react"; 
import ClientsNavbar from "../../features/clients/components/ClientsNavbar";

// Orders pages
import OrdersList from "./OrdersList";
import AddOrder from "./AddOrder";
import EditOrder from "./EditOrder";
import OrderDetails from "./OrderDetails";

const OrdersModule = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8faff] dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER CARD - Compact & Light Blue (Matching image_2) */}
        <div className="bg-[#f0f7ff] dark:bg-blue-950/40 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          
          {/* Icon Box - Deep Blue Gradient (Scaled down to w-14) */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-none flex-shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          
          <div>
            {/* Title - Scaled down to text-2xl */}
            <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              Clients 
            </h1>
            {/* Subtitle - Scaled down to text-sm */}
            <p className="text-sm text-slate-500 dark:text-blue-200/70 mt-0.5">
              Manage clients and orders
            </p>
          </div>
        </div>

        {/* NAVBAR CONTAINER  */}
        <div className="inline-flex items-center bg-white dark:bg-gray-900 p-1.5 rounded-[18px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-gray-800">
          <ClientsNavbar />
        </div>

        {/* ROUTES CONTENT */}
        <div className="mt-6">
          <Routes>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<OrdersList />} />
            <Route path="add" element={<AddOrder />} />
            <Route path="edit/:id" element={<EditOrder />} />
            <Route path=":id" element={<OrderDetails />} />
            <Route path="*" element={<Navigate to="list" replace />} />
          </Routes>
        </div>

      </div>
    </div>
  );
};

export default OrdersModule;