import { Router } from "express";
import { protect } from '../middleware/authMiddleware.js';
import { createBooking, releaseSeat, selectSeat } from "../controller/bookingController.js";
import { createCheckout } from "../controller/checkoutController.js";

const router = Router();

router.post('/:seatId/book' , protect, createBooking);
router.post('/:seatId/select' ,protect, selectSeat);
router.post('/:seatId/release', protect, releaseSeat);

router.post('/:seatId/checkout', protect, createCheckout);
export default router;