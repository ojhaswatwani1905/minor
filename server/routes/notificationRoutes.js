import express from 'express';
import { getNotifications, markAsRead, clearNotifications } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.put('/mark-read', markAsRead);
router.delete('/clear', clearNotifications);

export default router;
