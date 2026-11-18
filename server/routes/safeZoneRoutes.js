import express from 'express';
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

// Geocoding query (proxy to OpenStreetMap Nominatim with caching)
router.get('/geocode', geocodeDestination);

// Tourist Safe Travel Zone Endpoints
router.post('/', createSafeZoneTrip);
router.get('/active', getActiveSafeZoneTrip);
router.get('/active/:userId', getActiveSafeZoneTrip);
router.post('/:id/location', updateSafeZoneLocation);
router.post('/:id/confirm-safe', confirmSafe);
router.post('/:id/status', updateSafeZoneStatus);

// Admin Command Portal Endpoints (Protected with JWT authentication)
router.get('/all', protect, getAllSafeZones);
router.get('/incidents', protect, getGeofenceIncidents);

export default router;

