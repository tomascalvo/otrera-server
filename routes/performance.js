import express from 'express';

import {
  createPerformance,
  getPerformances,
  getPerformancesByMovement,
  getPerformance,
} from '../controllers/performance.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createPerformance);
router.get('/', auth, getPerformances);
router.get('/movement/:movementId/user/:userId', auth, getPerformancesByMovement);
router.get('/:id', auth, getPerformance);

export default router;