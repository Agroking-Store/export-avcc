import { Booking, IBooking } from '../models/Booking.model';
import { CreateBookingDto } from '../dto/booking.dto';

export class BookingService {
  static async create(bookingData: CreateBookingDto): Promise<IBooking> {
    for (const vehicle of bookingData.vehicles) {
      const existingVehicle = await Booking.findOne({
        $or: [
          { 'vehicles.engineNo': vehicle.engineNo },
          { 'vehicles.chassisNo': vehicle.chassisNo },
        ],
      });

      if (existingVehicle) {
        const conflict =
          existingVehicle.vehicles.find(
            (v) =>
              v.engineNo === vehicle.engineNo ||
              v.chassisNo === vehicle.chassisNo
          );
        const conflictField =
          conflict?.engineNo === vehicle.engineNo ? 'Engine No' : 'Chassis No';
        throw new Error(
          `Vehicle with ${conflictField} "${conflictField === 'Engine No' ? vehicle.engineNo : vehicle.chassisNo}" is already booked`
        );
      }
    }

    const booking = new Booking(bookingData);
    return await booking.save();
  }

  static async getAll(): Promise<IBooking[]> {
    return await Booking.find()
      .populate('dealerId', 'name contact')
      .sort({ createdAt: -1 });
  }

  static async getById(id: string): Promise<IBooking | null> {
    return await Booking.findById(id).populate('dealerId', 'name contact');
  }

  static async getByDealer(dealerId: string): Promise<IBooking[]> {
    return await Booking.find({ dealerId })
      .populate('dealerId', 'name contact')
      .sort({ createdAt: -1 });
  }

  static async update(
    id: string,
    updateData: Partial<IBooking>
  ): Promise<IBooking | null> {
    const currentBooking = await Booking.findById(id);
    if (!currentBooking) {
      throw new Error('Booking not found');
    }

    const statusOrder: { [key: string]: number } = {
      'To be Sourced': 0,
      'Booked': 1,
      'Payment Done': 2,
      'Transit': 3,
      'JNPT Warehouse': 4,
      'Shipped': 5,
      'Commercial Invoice Submitted': 6
    };

    if (updateData.status) {
      const currentIndex = statusOrder[currentBooking.status];
      const newIndex = statusOrder[updateData.status as string];
      if (newIndex !== currentIndex && newIndex !== currentIndex + 1) {
        throw new Error(`Status must be current ("${currentBooking.status}") or next stage only. Cannot skip to "${updateData.status}".`);
      }
    }

    if (updateData.vehicles) {
      for (const vehicle of updateData.vehicles) {
        const existingVehicle = await Booking.findOne({
          $or: [
            { 'vehicles.engineNo': vehicle.engineNo },
            { 'vehicles.chassisNo': vehicle.chassisNo },
          ],
          _id: { $ne: id },
        });

        if (existingVehicle) {
          const conflict =
            existingVehicle.vehicles.find(
              (v) =>
                v.engineNo === vehicle.engineNo ||
                v.chassisNo === vehicle.chassisNo
            );
          const conflictField =
            conflict?.engineNo === vehicle.engineNo
              ? 'Engine No'
              : 'Chassis No';
          throw new Error(
            `Vehicle with ${conflictField} "${conflictField === 'Engine No' ? vehicle.engineNo : vehicle.chassisNo}" is already booked`
          );
        }
      }
    }

  return await Booking.findByIdAndUpdate(id, updateData, { 
    returnDocument: 'after'
   }).populate('dealerId', 'name contact');
  }

  static async delete(id: string): Promise<IBooking | null> {
    return await Booking.findByIdAndDelete(id);
  }

  static async deleteByOrderId(orderId: string): Promise<number> {
    const result = await Booking.deleteMany({ orderId });
    return result.deletedCount ?? 0;
  }

  static async getBookingsCount(): Promise<number> {
    return await Booking.countDocuments();
  }

  static async getRecentBookings(limit: number = 5): Promise<IBooking[]> {
    return await Booking.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('dealerId', 'name');
  }
}
export const getLatestBookingVehiclesService = async () => {
  try {
    const bookings = await Booking.aggregate([
      // 🥇 Step 1: Latest bookings first
      {
        $sort: { createdAt: -1, _id: -1 }, // fallback for safety
      },

      // 🎯 Step 2: Take latest bookings (adjust if needed)
      {
        $limit: 5,
      },

      // 🚗 Step 3: Extract vehicles from those bookings
      {
        $unwind: "$vehicles",
      },

      // 🔗 Step 4: Join dealer info
      {
        $lookup: {
          from: "dealers",
          localField: "dealerId",
          foreignField: "_id",
          as: "dealer",
        },
      },
      { $unwind: "$dealer" },

      // 🎨 Step 5: Shape response
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
    ]);

    return {
      count: bookings.length,
      data: bookings,
    };
  } catch (error) {
    console.error("Aggregation error:", error);
    throw new Error("Failed to fetch booking vehicles");
  }
};

export default BookingService;