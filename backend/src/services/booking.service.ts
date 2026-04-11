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

export default BookingService;