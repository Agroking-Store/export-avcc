import { Vehicle, IVehicle } from '../models/Vehicle.model';
import { isValidObjectId } from 'mongoose';
import type { CreateVehicleDto, UpdateVehicleDto, BookVehicleDto } from '../dto/vehicle.dto';

export const createVehicleService = async (data: CreateVehicleDto): Promise<IVehicle> => {
  try {
    const vehicle = new Vehicle(data);
    return await vehicle.save();
  } catch (mongooseError) {
    throw new Error(mongooseError instanceof Error ? mongooseError.message : 'Failed to create vehicle');
  }
};

export const getVehiclesService = async (query: any) => {
  const { search, status, page = 1, limit = 10 } = query;
  const filter: any = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { engineNo: { $regex: search, $options: 'i' } },
      { chassisNo: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Vehicle.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / Number(limit));
  
  return {
    data: vehicles,
    pagination: { page: Number(page), limit: Number(limit), total, pages: totalPages }
  };
};

export const getVehicleByIdService = async (id: string): Promise<IVehicle | null> => {
  try {
    if (!id || id === 'undefined' || !isValidObjectId(id)) {
      throw new Error('Invalid vehicle ID');
    }
    return await Vehicle.findById(id);
  } catch (mongooseError) {
    throw new Error(mongooseError instanceof Error ? mongooseError.message : 'Failed to fetch vehicle');
  }
};

export const updateVehicleService = async (id: string, data: UpdateVehicleDto): Promise<IVehicle | null> => {
  try {
    if (!id || id === 'undefined' || !isValidObjectId(id)) {
      throw new Error('Invalid vehicle ID');
    }
    return await Vehicle.findByIdAndUpdate(id, data, { new: true });
  } catch (mongooseError) {
    throw new Error(mongooseError instanceof Error ? mongooseError.message : 'Failed to update vehicle');
  }
};

export const deleteVehicleService = async (id: string): Promise<void> => {
  try {
    if (!id || id === 'undefined' || !isValidObjectId(id)) {
      throw new Error('Invalid vehicle ID');
    }
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) throw new Error('Vehicle not found');
  } catch (mongooseError) {
    throw new Error(mongooseError instanceof Error ? mongooseError.message : 'Failed to delete vehicle');
  }
};

export const getVehicleStatsService = async () => {
  const stats = await Vehicle.aggregate([
    { $group: {
        _id: null,
        total: { $sum: 1 },
        booked: { $sum: { $cond: [{ $eq: ['$status', 'Booked'] }, 1, 0] } },
        available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } }
      }
    }
  ]);
  
  return {
    total: stats[0]?.total || 0,
    booked: stats[0]?.booked || 0,
    available: stats[0]?.available || 0
  };
};

export const bookVehicleService = async (data: BookVehicleDto): Promise<IVehicle> => {
  try {
    if (!data.vehicleId || data.vehicleId === 'undefined' || !isValidObjectId(data.vehicleId)) {
      throw new Error('Invalid vehicle ID');
    }
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');
    
    if (vehicle.status === 'Booked') throw new Error('Vehicle already booked');
    
    vehicle.status = 'Booked';
    vehicle.bookedBy = data.clientId;
    vehicle.updatedAt = new Date();
    
    return await vehicle.save();
  } catch (mongooseError) {
    throw new Error(mongooseError instanceof Error ? mongooseError.message : 'Failed to book vehicle');
  }
};
