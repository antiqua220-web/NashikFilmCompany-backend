import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('boss'), createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, authorize('boss'), updateProject)
  .delete(protect, authorize('boss'), deleteProject);

export default router;
