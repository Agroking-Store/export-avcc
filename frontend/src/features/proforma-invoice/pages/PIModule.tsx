import { FileText, Plus } from "lucide-react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import PINav from "../components/PINav";

// Pages
import PIDashboard from "./PIDashboard";
import PITablePage from "./PITablePage";
import OrderPITablePage from "./OrderPITablePage";
import CreatePI from "./CreatePI";
import PIDetails from "./PIDetails";
import PIOrderDetail from "./PIOrderDetail";
import { Button } from "@/components/ui/button";

import CreateTaxInvoice from "./CreateTaxInvoice";

// Utility function (moved from PIList.tsx)
const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

const PIModule = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900">
      <div className="px-6 py-5">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Proforma Invoice Module
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-300">
                Manage proforma invoices and related orders
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/proforma-invoice/add")}
            className="h-12 px-6 py-3 shrink-0 rounded-lg shadow-md bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold tracking-wide hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>Create PI</span>
          </Button>
        </div>

        {/* NAVBAR */}
        <div className="mt-2">
          <PINav />
        </div>

        <div className="mt-6">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            {/* DASHBOARD */}
            <Route path="dashboard" element={<PIDashboard />} />

            {/* PI PERSPECTIVE */}
            <Route
              path="list"
              element={<PITablePage generatePagination={generatePagination} />}
            />
            <Route path="add" element={<CreatePI />} />
            <Route path="edit/:id" element={<CreatePI />} />
            <Route path=":id" element={<PIDetails />} />

            {/* ORDER PERSPECTIVE */}
            <Route
              path="orders-list"
              element={
                <OrderPITablePage generatePagination={generatePagination} />
              }
            />
            <Route path="orders/:orderId" element={<PIOrderDetail />} />

            <Route
              path="create-tax-invoice/:id"
              element={<CreateTaxInvoice />}
            />
            {/* DEFAULT */}
            <Route
              path="*"
              element={<Navigate to="/proforma-invoice/dashboard" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default PIModule;
