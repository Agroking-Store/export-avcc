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
    <div className="h-full w-full bg-slate-50 dark:bg-gray-900">
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

        {/* NAVBAR (REUSED) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-2">
          <ClientsNavbar />
        </div>

        {/* ROUTES */}
        <div className="mt-6">
          <Routes>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<OrdersList />} />
            <Route path="add" element={<AddOrder />} />
            <Route path="edit/:id" element={<EditOrder />} />
            <Route path=":id" element={<OrderDetails />} />
          </Routes>
        </div>

      </div>
    </div>
  );
};

export default OrdersModule;