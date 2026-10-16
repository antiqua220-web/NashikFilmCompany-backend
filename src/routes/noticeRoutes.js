import express from 'express';
import {
  getNotices,
  createNotice,
  acknowledgeNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getNotices)
  .post(createNotice);

router.route('/:id/acknowledge').patch(acknowledgeNotice);
router.route('/:id').delete(authorize('boss'), deleteNotice);

export default router;
