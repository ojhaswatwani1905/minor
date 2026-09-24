import express from 'express';
import { getLiveLocations, getMovementHistory, updateLocation } from '../controllers/monitoringController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint for mobile background GPS location pings
router.post('/location-update', updateLocation);

router.use(protect); // Protected by JWT auth for admin endpoints

router.get('/live-locations', getLiveLocations);
router.get('/history/:id', getMovementHistory);

export default router;

