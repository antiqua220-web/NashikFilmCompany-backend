import express from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getSchedules)
  .post(protect, authorize('boss'), createSchedule);

router.route('/:id')
  .get(protect, getScheduleById)
  .put(protect, authorize('boss'), updateSchedule)
  .delete(protect, authorize('boss'), deleteSchedule);

export default router;
