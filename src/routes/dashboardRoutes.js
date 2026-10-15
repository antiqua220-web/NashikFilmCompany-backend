import express from 'express';
import { getBossDashboard, getEmployeeDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/boss', protect, authorize('boss'), getBossDashboard);
router.get('/employee', protect, getEmployeeDashboard);

export default router;
