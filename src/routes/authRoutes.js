import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  getAllUsers,
  createCrewMember,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getAllUsers);
router.post('/users', protect, authorize('boss'), createCrewMember);

export default router;
