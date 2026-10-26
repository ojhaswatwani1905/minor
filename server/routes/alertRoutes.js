import express from 'express';
import { 
  getAlerts, 
  getAlertById, 
  updateAlertStatus, 
  notifyGuardian, 
  simulateSosAlert,
  createSosAlert 
} from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoints for mobile app SOS distress broadcasts & simulator
router.post('/sos', createSosAlert);
router.post('/simulate', simulateSosAlert);
router.post('/', createSosAlert);

// Protected endpoints for Admin Command Center operations
router.use(protect);

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.put('/:id/status', updateAlertStatus);
router.post('/notify-guardian', notifyGuardian);

export default router;


