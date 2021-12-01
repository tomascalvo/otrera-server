import express from 'express';

import {
    createPlan,
    duplicatePlan,
    getPlans,
    getPlansByCreator,
    getPlan,
    suggestPlans,
    updatePlan,
    deletePlan
} from '../controllers/plan.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createPlan);
router.post('/:id/duplicate', auth, duplicatePlan);
router.get('/', getPlans);
router.get('/creator/:creatorId', getPlansByCreator);
router.get('/:id', getPlan);
router.get(`/suggest/:targetId`, auth, suggestPlans);
router.patch('/:id', auth, updatePlan);
router.delete('/:id', auth, deletePlan);

export default router;