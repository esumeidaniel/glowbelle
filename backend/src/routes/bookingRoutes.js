import express from 'express';
import { cancelBooking, createBooking, getBooking, myBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { authorize, optionalProtect, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', optionalProtect, upload.single('inspirationImage'), createBooking);
router.get('/my-bookings', protect, myBookings);
router.get('/:id', protect, getBooking);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/status', protect, authorize('admin', 'stylist'), updateBookingStatus);

export default router;
