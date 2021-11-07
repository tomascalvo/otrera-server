import express from 'express';

import {
    createBodyStatus,
    createBodyStatusesByUser,
    getCurrentBodyStatusesByUser,
} from '../controllers/bodyStatus.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createBodyStatus);
router.post('/user/:id/multiple', auth, createBodyStatusesByUser);
router.get('/user/:id/current', auth, getCurrentBodyStatusesByUser);

export default router;