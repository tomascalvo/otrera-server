import express from 'express';

import {
  createGoal,
  getGoals,
  getGoal,
  getProgress,
  deleteGoal,
} from '../controllers/goal.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createGoal);
router.get('/user/:id', auth, getGoals);
router.get('/:id', auth, getGoal);
router.get('/user/:userId/progress', auth, getProgress);
router.delete(`/:goalId`, auth, deleteGoal);

export default router;