import { Booking, IBooking } from '../models/Booking.model';
import { CreateBookingDto } from '../dto/booking.dto';

export class BookingService {
  static async create(bookingData: CreateBookingDto): Promise<IBooking> {
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

export default BookingService;
