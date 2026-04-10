import { Router } from 'express';
import { createBooking, getAllBookings, getBookingById, getBookingsByDealer, updateBooking, deleteBooking } from '../controllers/booking.controller';
import { authenticate as authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validateCreateBooking, validateUpdateBooking } from '../validations/booking.validation';

const router = Router();

router.post('/', authMiddleware, validateCreateBooking, createBooking);
router.get('/', authMiddleware, getAllBookings);
router.get('/:id', authMiddleware, getBookingById);
router.get('/dealer/:dealerId', authMiddleware, getBookingsByDealer);
router.put('/:id', authMiddleware, validateUpdateBooking, updateBooking);
router.delete('/:id', authMiddleware, deleteBooking);

export default router;
