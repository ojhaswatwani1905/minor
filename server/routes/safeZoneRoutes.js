import express from 'express';
import {
  geocodeDestination,
  reverseGeocodeDestination,
  createSafeZoneTrip,
  getActiveSafeZoneTrip,
  getSafeZoneTripById,
  updateSafeZoneLocation,
  acknowledgeBreachWarning,
  escalateBreach,
  reportBreachEvent,
  getEscalationWorkerStatus,
  confirmSafe,
  updateSafeZoneStatus,
  getAllSafeZones,
  getGeofenceIncidents
} from '../controllers/safeZoneController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Geocoding query (proxy to OpenStreetMap Nominatim with caching)
router.get('/geocode', geocodeDestination);
router.get('/reverse-geocode', reverseGeocodeDestination);

// Escalation Worker Diagnostics
router.get('/worker-status', getEscalationWorkerStatus);

// Admin Command Portal Endpoints (Protected with JWT authentication)
router.get('/all', protect, getAllSafeZones);
router.get('/incidents', protect, getGeofenceIncidents);

// Tourist Safe Travel Zone Endpoints
router.post('/', createSafeZoneTrip);
router.get('/active', getActiveSafeZoneTrip);
router.get('/active/:userId', getActiveSafeZoneTrip);
router.get('/:id', getSafeZoneTripById);
router.post('/:id/location', updateSafeZoneLocation);
router.post('/:id/breach', reportBreachEvent);
router.post('/:id/acknowledge-warning', acknowledgeBreachWarning);
router.post('/:id/escalate-breach', escalateBreach);
router.post('/:id/confirm-safe', confirmSafe);
router.post('/:id/status', updateSafeZoneStatus);

export default router;

