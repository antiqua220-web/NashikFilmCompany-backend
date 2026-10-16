import express from 'express';
import {
  getGearItems,
  getGearItemById,
  createGearItem,
  updateGearItem,
  updateGearStatus,
  addGearIncident,
  deleteGearItem,
} from '../controllers/gearController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getGearItems)
  .post(createGearItem);

router
  .route('/:id')
  .get(getGearItemById)
  .put(updateGearItem)
  .delete(authorize('boss'), deleteGearItem);

router.route('/:id/status').patch(updateGearStatus);
router.route('/:id/incidents').post(addGearIncident);

export default router;
