import express from 'express';
import { getProfile, updateProfile, uploadAvatar, changePassword } from '../controllers/profileController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Profile operations protected by JWT

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', uploadAvatar);
router.put('/change-password', changePassword);

export default router;
