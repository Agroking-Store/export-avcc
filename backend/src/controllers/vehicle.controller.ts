import { Request, Response } from 'express';
import * as vehicleService from '../services/vehicle.service';

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.createVehicleService(req.body);
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.log('Vehicle controller error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to create vehicle'
    });
  }
};

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.getVehiclesService(req.query);
    res.json({
      success: true,
      message: 'Vehicles fetched successfully',
      data: vehicles
    });
  } catch (error) {
    console.log('Vehicles list error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to fetch vehicles'
    });
  }
};

export const getVehicleStats = async (req: Request, res: Response) => {
  try {
    const stats = await vehicleService.getVehicleStatsService();
    res.json({
      success: true,
      message: 'Stats fetched successfully',
      data: stats
    });
  } catch (error) {
    console.log('Vehicle stats error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to fetch stats'
    });
  }
};

export const getVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicleByIdService(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    res.json({
      success: true,
      message: 'Vehicle fetched successfully',
      data: vehicle
    });
  } catch (error) {
    console.log('Get vehicle error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to fetch vehicle'
    });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.updateVehicleService(req.params.id, req.body);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.log('Update vehicle error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to update vehicle'
    });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    await vehicleService.deleteVehicleService(req.params.id);
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.log('Delete vehicle error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to delete vehicle'
    });
  }
};

export const bookVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.bookVehicleService(req.body);
    res.json({
      success: true,
      message: 'Vehicle booked successfully',
      data: vehicle
    });
  } catch (error) {
    console.log('Book vehicle error:', error);
    const errMsg = error && error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: errMsg || 'Failed to book vehicle'
    });
  }
};
