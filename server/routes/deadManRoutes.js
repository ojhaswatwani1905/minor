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
import { protect, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin inspection: strictly protected with Admin role check
router.get('/all', protect, getAllDeadManSessions);

// Targeted tourist status check: strictly protected (only owning tourist or admin can inspect)
router.get('/status/:userId', protect, getDeadManStatus);

// Tourist lifecycle endpoints
router.post('/start', optionalProtect, startDeadManSession);
router.get('/status', optionalProtect, getDeadManStatus);
router.post('/check-in', optionalProtect, checkInDeadMan);
router.post('/pause', optionalProtect, pauseDeadManSession);
router.post('/resume', optionalProtect, resumeDeadManSession);
router.post('/stop', optionalProtect, stopDeadManSession);
router.post('/telemetry', optionalProtect, updateDeadManTelemetry);

export default router;

