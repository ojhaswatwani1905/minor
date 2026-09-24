import express from 'express';
import { getAlerts, getAlertById, updateAlertStatus, notifyGuardian, simulateSosAlert } from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoint for mobile app SOS broadcasts & simulator
router.post('/simulate', simulateSosAlert);

router.use(protect); // Protected by JWT auth

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.put('/:id/status', updateAlertStatus);
router.post('/notify-guardian', notifyGuardian);

export default router;

