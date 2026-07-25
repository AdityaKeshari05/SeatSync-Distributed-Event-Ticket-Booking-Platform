import { Router } from "express";
import { protect } from '../middleware/authMiddleware.js';
import { createBooking, releaseSeat, selectSeat } from "../controller/bookingController.js";

const router = Router();

router.post('/:seatId/book' , protect, createBooking);
router.post('/:seatId/select' ,protect, selectSeat);
router.post('/:seatId/release', protect, releaseSeat);

export default router;