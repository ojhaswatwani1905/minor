import express from 'express';
import { getTrips, getTripById, createTrip, updateTrip, deleteTrip, addCheckpoint, safeCheckIn, extendDeadline } from '../controllers/tripController.js';
import {
  geocodeDestination,
  createSafeZoneTrip,
  getActiveSafeZoneTrip,
  updateSafeZoneLocation,
  confirmSafe,
  updateSafeZoneStatus,
  getAllSafeZones,
  getGeofenceIncidents
} from '../controllers/safeZoneController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Safe Travel Zone endpoints (accessible by mobile tourist & admin)
router.get('/geocode', geocodeDestination);
router.post('/safe-zone', createSafeZoneTrip);
router.get('/safe-zone/active', getActiveSafeZoneTrip);
router.get('/safe-zone/active/:userId', getActiveSafeZoneTrip);
router.post('/safe-zone/:id/location', updateSafeZoneLocation);
router.post('/safe-zone/:id/confirm-safe', confirmSafe);
router.post('/safe-zone/:id/status', updateSafeZoneStatus);
router.get('/safe-zone/all', getAllSafeZones);
router.get('/safe-zone/incidents', getGeofenceIncidents);

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



