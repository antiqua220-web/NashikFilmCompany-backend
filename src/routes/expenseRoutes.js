import express from 'express';
import {
  getExpenses,
  getExpenseStats,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/stats').get(getExpenseStats);

router
  .route('/:id')
  .put(updateExpense)
  .delete(authorize('boss'), deleteExpense);

export default router;
