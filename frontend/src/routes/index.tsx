import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../components/layout/MainLayout";

// Auth pages
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";
import Dealers from "../features/dealers/pages/Dealers";
import AddDealer from "../features/dealers/pages/AddDealer";
import DealerDetails from "../features/dealers/pages/DealerDetails";
import EditDealer from "../features/dealers/pages/EditDealer";

// Dashboard
import Dashboard from "../features/dashboard/pages/Dashboard";

//pages
//client
import ClientsModule from "../features/clients/pages/ClientsModule";
import OrdersModule from "../features/orders/OrdersModule";
//PI
import CreatePI from "../features/proforma-invoice/pages/CreatePI";
import PIList from "../features/proforma-invoice/pages/PIList";
import EditPI from "../features/proforma-invoice/pages/EditPI";
import PIDetails from "../features/proforma-invoice/pages/PIDetails";


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
           {/* CLIENT MODULE ROUTES */}
          <Route path="/clients" element={<Navigate to="/clients/dashboard" replace />} />
          <Route path="/clients/*" element={<ClientsModule />} />
          
          {/* ORDERS MODULE ROUTES */}
          <Route path="/orders" element={<Navigate to="/orders/list" replace />} />
          <Route path="/orders/*" element={<OrdersModule />} />

          <Route path="/dealers" element={<Dealers />} />
<Route path="/dealers/add" element={<AddDealer />} />
<Route path="/dealers/:id" element={<DealerDetails />} />
<Route path="/dealers/edit/:id" element={<EditDealer />} />

          
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
