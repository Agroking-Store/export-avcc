import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/layout/MainLayout";

// Auth pages
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";

// Dashboard
import Dashboard from "../features/dashboard/pages/Dashboard";

// Clients
import ClientsList from "../features/clients/pages/ClientsList";
import AddClient from "../features/clients/pages/AddClient";
import EditClient from "../features/clients/pages/EditClient";
import ClientDetails from "../features/clients/pages/ClientDetails";

// Dealers
import DealersDashboard from "../features/dealers/pages/DealersDashboard";
import Dealers from "../features/dealers/pages/Dealers";
import AddDealer from "../features/dealers/pages/AddDealer";
import DealerDetails from "../features/dealers/pages/DealerDetails";
import EditDealer from "../features/dealers/pages/EditDealer";
import DealerOrders from "../features/dealers/pages/DealerOrders";
import DealerOrdersList from "../features/dealers/pages/DealerOrdersList";
import DealerOrderDetails from "../features/dealers/pages/DealerOrderDetails";

// PI
import CreatePI from "../features/proforma-invoice/pages/CreatePI";
import PIList from "../features/proforma-invoice/pages/PIList";
import PIDetails from "../features/proforma-invoice/pages/PIDetails";

// Orders
import OrdersList from "../features/orders/OrdersList";
import AddOrder from "../features/orders/AddOrder";
import EditOrder from "../features/orders/EditOrder";
import OrderDetails from "../features/orders/OrderDetails";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Private routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* Vehicles */}
          <Route
            path="/vehicles"
            element={<div className="p-6">Vehicles Page (Coming Soon)</div>}
          />

          {/* Clients */}
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/add" element={<AddClient />} />
          <Route path="/clients/edit/:id" element={<EditClient />} />
          <Route path="/clients/:id" element={<ClientDetails />} />

          {/* Dealers — specific routes BEFORE dynamic :id */}
          <Route path="/dealers" element={<Dealers />} />
          <Route path="/dealers/dashboard" element={<DealersDashboard />} />
          <Route path="/dealers/add" element={<AddDealer />} />
          <Route path="/dealers/orders/:id" element={<DealerOrderDetails />} />
          <Route path="/dealers/edit/:id" element={<EditDealer />} />
          <Route path="/dealers/orders" element={<DealerOrdersList />} />
          <Route path="/dealers/orders/add" element={<DealerOrders />} />
          <Route path="/dealers/:id" element={<DealerDetails />} />

          {/* Orders */}
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/add" element={<AddOrder />} />
          <Route path="/orders/edit/:id" element={<EditOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />

          {/* Proforma Invoice */}
          <Route path="/proforma-invoice" element={<PIList />} />
          <Route path="/proforma-invoice/add" element={<CreatePI />} />
          <Route path="/proforma-invoice" element={<PIList />} />
          <Route path="/proforma-invoice/edit/:id" element={<CreatePI />} />
          <Route path="/proforma-invoice/:id" element={<PIDetails />} />

          {/* Coming Soon */}
          <Route
            path="/letter-of-credit"
            element={
              <div className="p-6">Letter of Credit Page (Coming Soon)</div>
            }
          />
          <Route
            path="/invoices"
            element={<div className="p-6">Invoices Page (Coming Soon)</div>}
          />
          <Route
            path="/documents"
            element={<div className="p-6">Documents Page (Coming Soon)</div>}
          />
          <Route
            path="/verification"
            element={<div className="p-6">Verification Page (Coming Soon)</div>}
          />
          <Route
            path="/reports"
            element={<div className="p-6">Reports Page (Coming Soon)</div>}
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<div className="p-6">404 - Page Not Found</div>}
      />
    </Routes>
  );
};

export default AppRoutes;
