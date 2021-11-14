import express from 'express';

import {
    createSession,
    createSingleMovementSession,
    getSessions,
    getSession,
    getSessionsByPlanAndUser,
    getRecentSessions,
    getPreviousSessions,
    getUpcomingSessions,
} from '../controllers/session.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createSession);
router.post('/movement/:movementId', auth, createSingleMovementSession);
router.get('/', auth, getSessions);
router.get('/:id', auth, getSession),
router.get(`/plan/:planId/user/:userId`, auth, getSessionsByPlanAndUser,
);
router.get(`/recent/plan/:planId/user/:userId`, auth, getRecentSessions,
);
router.get(`/user/:userId/previous`, auth, getPreviousSessions);
router.get(`/user/:userId/upcoming`, auth, getUpcomingSessions);

export default router;