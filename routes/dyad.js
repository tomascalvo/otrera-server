import express from 'express';

import {
  createDyad,
  getDyads,
  deleteDyad,
} from '../controllers/dyad.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:otherId', auth, createDyad);
router.get('/', auth, getDyads);
router.delete('/delete/:dyadId', auth, deleteDyad);

export default router;