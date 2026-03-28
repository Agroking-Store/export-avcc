import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import VehicleList from "../features/vehicles/VehicleList";
import BookVehicle from "../features/vehicles/BookVehicle";
import AddVehicle from "../features/vehicles/AddVehicle";
import EditVehicle from "../features/vehicles/EditVehicle";
import VehicleDetails from "../features/vehicles/VehicleDetails";

const VehicleRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/list" element={<VehicleList />} />
      <Route path="/book" element={<BookVehicle />} />
      <Route path="/add" element={<AddVehicle />} />
      <Route path="/edit/:id" element={<EditVehicle />} />
      <Route path="/:id" element={<VehicleDetails />} />
    </Routes>
  );
};

export default VehicleRoutes;

