import express from 'express';

import {
    createBodyStatus,
    createBodyStatusesByUser,
    createFullRecovery,
    getCurrentBodyStatusesByUser,
} from '../controllers/bodyStatus.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createBodyStatus);
router.post('/user/:id/multiple', auth, createBodyStatusesByUser);
router.post('/recover/user/:userId', auth, createFullRecovery);
router.get('/user/:id/current', auth, getCurrentBodyStatusesByUser);

export default router;