import express from 'express';
import {
  startDeadManSession,
  getDeadManStatus,
  checkInDeadMan,
  pauseDeadManSession,
  resumeDeadManSession,
  stopDeadManSession,
  updateDeadManTelemetry,
  getAllDeadManSessions
} from '../controllers/deadManController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin inspection
router.get('/all', protect, getAllDeadManSessions);

// Tourist lifecycle endpoints
router.post('/start', startDeadManSession);
router.get('/status', getDeadManStatus);
router.get('/status/:userId', getDeadManStatus);
router.post('/check-in', checkInDeadMan);
router.post('/pause', pauseDeadManSession);
router.post('/resume', resumeDeadManSession);
router.post('/stop', stopDeadManSession);
router.post('/telemetry', updateDeadManTelemetry);

export default router;
