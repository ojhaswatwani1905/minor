import express from 'express';
import { getTrips, getTripById, createTrip, updateTrip, deleteTrip, addCheckpoint, safeCheckIn, extendDeadline } from '../controllers/tripController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Allow public expedition creation & check-ins from mobile app
router.post('/', createTrip);
router.post('/:id/checkin', safeCheckIn);
router.post('/:id/extend-deadline', extendDeadline);

router.use(protect); // Protected by JWT auth for admin endpoints

router.get('/', getTrips);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/checkpoints', addCheckpoint);

export default router;


