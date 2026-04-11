import { Booking, IBooking } from '../models/Booking.model';
import { CreateBookingDto } from '../dto/booking.dto';

export class BookingService {
  static async create(bookingData: CreateBookingDto): Promise<IBooking> {
    // Check for duplicate bookings for the same vehicles
    for (const vehicle of bookingData.vehicles) {
      const query: any = {
        'vehicles.name': vehicle.name,
        'vehicles.color': vehicle.color,
        status: 'Booked'
      };
      if (vehicle.srNo) {
        query['vehicles.srNo'] = vehicle.srNo;
      }
      const existingBooking = await Booking.findOne(query);
      
      if (existingBooking) {
        throw new Error(`Vehicle ${vehicle.name} (${vehicle.color}) ${vehicle.srNo ? `SR#${vehicle.srNo}` : ''} is already booked`);
      }

      // Unique check for Engine No and Chassis No
      const existingVehicle = await Booking.findOne({
        $or: [
          { 'vehicles.engineNo': vehicle.engineNo },
          { 'vehicles.chassisNo': vehicle.chassisNo }
        ]
      });

      if (existingVehicle) {
        throw new Error('Engine No or Chassis No already exists');
      }
    }
    
    const booking = new Booking(bookingData);
    return await booking.save();
  }

  static async getAll(): Promise<IBooking[]> {
    return await Booking.find().populate('dealerId', 'name contact').sort({ createdAt: -1 });
  }

  static async getById(id: string): Promise<IBooking | null> {
    return await Booking.findById(id).populate('dealerId', 'name contact');
  }

  static async getByDealer(dealerId: string): Promise<IBooking[]> {
    return await Booking.find({ dealerId }).populate('dealerId', 'name contact').sort({ createdAt: -1 });
  }

  static async update(id: string, updateData: Partial<IBooking>): Promise<IBooking | null> {
    if (updateData.vehicles) {
      for (const vehicle of updateData.vehicles) {
        // Unique check for Engine No and Chassis No during update
        const existingVehicle = await Booking.findOne({
          $or: [
            { 'vehicles.engineNo': vehicle.engineNo },
            { 'vehicles.chassisNo': vehicle.chassisNo }
          ],
          _id: { $ne: id }
        });

        if (existingVehicle) {
          throw new Error('Engine No or Chassis No already exists');
        }
      }
    }

    return await Booking.findByIdAndUpdate(id, updateData, { new: true }).populate('dealerId', 'name contact');
  }

  static async delete(id: string): Promise<IBooking | null> {
    return await Booking.findByIdAndDelete(id);
  }

  static async getBookingsCount(): Promise<number> {
    return await Booking.countDocuments();
  }

  static async getRecentBookings(limit: number = 5): Promise<IBooking[]> {
    return await Booking.find().sort({ createdAt: -1 }).limit(limit).populate('dealerId', 'name');
  }
}
export const getLatestBookingVehiclesService = async () => {
  try {
    const bookings = await Booking.aggregate([
      // 🔥 flatten vehicles array
      { $unwind: "$vehicles" },

      // 🔗 join dealer
      {
        $lookup: {
          from: "dealers",
          localField: "dealerId",
          foreignField: "_id",
          as: "dealer",
        },
      },
      { $unwind: "$dealer" },

      // 🧹 shape output
      {
        $project: {
          _id: 0,
          bookingId: "$_id",
          date: 1,
          status: 1,
          dealerName: "$dealer.name",

          hsnCode: "$vehicles.hsnCode",
          name: "$vehicles.name",
          color: "$vehicles.color",
          chassisNo: "$vehicles.chassisNo",
          engineNo: "$vehicles.engineNo",
          quantity: "$vehicles.quantity",
          srNo: "$vehicles.srNo",
          fobAmount: "$vehicles.fobAmount",
        },
      },

      // ⏱ latest first
      { $sort: { createdAt: -1 } },

      // 🎯 only 5
      { $limit: 5 },
    ]);

    return {
      count: bookings.length,
      data: bookings,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch booking vehicles");
  }
};

export default BookingService;
