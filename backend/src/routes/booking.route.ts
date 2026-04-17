import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByDealer,
  updateBooking,
  deleteBooking,
  deleteBookingsByOrder,
  getLatestBookingVehicles,
} from '../controllers/booking.controller';
import { authenticate as authMiddleware } from '../middleware/auth.middleware';
import { validateCreateBooking, validateUpdateBooking } from '../validations/booking.validation';

const router = Router();

router.post('/', authMiddleware, validateCreateBooking, createBooking);
router.get('/', authMiddleware, getAllBookings);
router.get("/latestVehicles", getLatestBookingVehicles);
router.get('/:id', authMiddleware, getBookingById);
router.get('/dealer/:dealerId', authMiddleware, getBookingsByDealer);
router.put('/:id', authMiddleware, validateUpdateBooking, updateBooking);
router.delete('/:id', authMiddleware, deleteBooking);

// ✅ NEW: Cascade delete all bookings for a given orderId
// Call this from your Order delete controller/service
router.delete('/order/:orderId', authMiddleware, deleteBookingsByOrder);

export default router;