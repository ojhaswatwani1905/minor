import express from 'express';
import { getSettings, updateSettings, downloadBackup } from '../controllers/settingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/backup', downloadBackup);

export default router;
