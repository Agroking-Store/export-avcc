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

//pages
//client
import ClientsList from "../features/clients/ClientsList";
import AddClient from "../features/clients/AddClient";
import EditClient from "../features/clients/EditClient";
import ClientDetails from "../features/clients/ClientDetails";
//PI
import CreatePI from "../features/proforma-invoice/pages/CreatePI";
import PIList from "../features/proforma-invoice/pages/PIList";
import EditPI from "../features/proforma-invoice/pages/EditPI";
import PIDetails from "../features/proforma-invoice/pages/PIDetails";
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

          {/* Placeholder routes */}
          <Route
            path="/vehicles"
            element={<div className="p-6">Vehicles Page (Coming Soon)</div>}
          />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/add" element={<AddClient />} />
          <Route path="/clients/edit/:id" element={<EditClient />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/add" element={<AddOrder />} />
          <Route path="/orders/edit/:id" element={<EditOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route
            path="/dealers"
            element={<div className="p-6">Dealers Page (Coming Soon)</div>}
          />
          <Route path="/proforma-invoice/add" element={<CreatePI />} />
          <Route path="/proforma-invoice" element={<PIList />} />
          <Route path="/proforma-invoice/edit/:id" element={<EditPI />} />
          <Route path="/proforma-invoice/:id" element={<PIDetails />} />
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
