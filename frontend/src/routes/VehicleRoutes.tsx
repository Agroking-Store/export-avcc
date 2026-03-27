import React from "react";
import { Route, Routes, useParams } from "react-router-dom";
import VehicleList from "../features/vehicles/VehicleList";
import AddVehicle from "../features/vehicles/AddVehicle";
import EditVehicle from "../features/vehicles/EditVehicle";

const VehicleRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<VehicleList />} />
      <Route path="/add" element={<AddVehicle />} />
      <Route path="/edit/:id" element={<EditVehicle />} />
    </Routes>
  );
};

export default VehicleRoutes;

