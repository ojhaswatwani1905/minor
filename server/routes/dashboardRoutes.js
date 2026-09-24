import express from 'express';
import { getStats, getCharts, getRecentActivity } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getStats);
router.get('/charts', protect, getCharts);
router.get('/recent-activity', protect, getRecentActivity);

export default router;
