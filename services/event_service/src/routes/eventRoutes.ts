import { Router } from 'express';
import { createEvent, getEvents, getEventSeats } from '../controller/eventController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getSeatInternal, updatedSeatInternal } from '../controller/internalSeats.js';

const router = Router();

router.post('/event' , protect , restrictTo('admin') , createEvent);
router.get('/' , getEvents);
router.get('/event/:id/seats' , getEventSeats);

router.get('/internal/seats/:seatId', getSeatInternal);
router.patch('/internal/seats/:seatId', updatedSeatInternal);

export default router;