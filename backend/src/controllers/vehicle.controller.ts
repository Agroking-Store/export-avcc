import { Request, Response } from "express";
import { Vehicle } from "../models/Vehicle.model";
import * as vehicleService from "../services/vehicle.service";
import path from "path";
import fs from "fs";

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.createVehicleService(req.body);
    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    console.log("Vehicle controller error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to create vehicle",
    });
  }
};

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getVehiclesService(req.query);
    res.json({
      success: true,
      message: "Vehicles fetched successfully",
      data: vehicles,
    });
  } catch (error) {
    console.log("Vehicles list error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to fetch vehicles",
    });
  }
};

export const getVehicleStats = async (req: Request, res: Response) => {
  try {
    const stats = await vehicleService.getVehicleStatsService();
    res.json({
      success: true,
      message: "Stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    console.log("Vehicle stats error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to fetch stats",
    });
  }
};

export const getVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleByIdService(
      req.params.id as string,
    );
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    res.json({
      success: true,
      message: "Vehicle fetched successfully",
      data: vehicle,
    });
  } catch (error) {
    console.log("Get vehicle error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to fetch vehicle",
    });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.updateVehicleService(
      req.params.id as string,
      req.body,
    );
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.log("Update vehicle error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to update vehicle",
    });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    await vehicleService.deleteVehicleService(req.params.id as string);
    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.log("Delete vehicle error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to delete vehicle",
    });
  }
};

export const bookVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.bookVehicleService(req.body);
    res.json({
      success: true,
      message: "Vehicle booked successfully",
      data: vehicle,
    });
  } catch (error) {
    console.log("Book vehicle error:", error);
    const errMsg =
      error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || "Failed to book vehicle",
    });
  }
};

export const uploadVehicleDocuments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const updateData: any = {};
    if (files["form20"]) updateData["form20"] = files["form20"][0].path;
    if (files["form21"]) updateData["form21"] = files["form21"][0].path;
    if (files["form22"]) updateData["form22"] = files["form22"][0].path;
    if (files["tempRegCert"])
      updateData["tempRegCert"] = files["tempRegCert"][0].path;
    if (files["bvCertificate"])
      updateData["bvCertificate"] = files["bvCertificate"][0].path;
    const standaloneVehicle = await Vehicle.findById(id);

    if (!standaloneVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const newDocs = { ...standaloneVehicle.documents, ...updateData };
    const isCRTMComplete = !!(
      newDocs.form20 &&
      newDocs.form21 &&
      newDocs.form22 &&
      newDocs.tempRegCert
    );
    const isBVComplete = !!newDocs.bvCertificate;

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        $set: {
          documents: newDocs,
          isCRTMUploaded: isCRTMComplete,
          isBVUploaded: isBVComplete,
        },
      },
      { new: true },
    );

    return res.json({
      success: true,
      message: "Vehicle documents updated",
      data: updatedVehicle,
    });
  } catch (error: any) {
    console.error("Document upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicleFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const field = Array.isArray(req.params.field)
      ? req.params.field[0]
      : req.params.field;
    const { download } = req.query; // Check if user wants to force download

    const standalone = await Vehicle.findById(id);
    const vehicle = standalone;

    if (!vehicle || !vehicle.documents || !(vehicle.documents as any)[field]) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = (vehicle.documents as any)[field];

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    if (download === "true") {
      return res.download(filePath);
    } else {
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
