import express from 'express';

import {
  createConnectionRequest,
  getInbox,
  approveRequest,
  denyRequest,
  deleteConnectionRequest,
} from '../controllers/connectionRequest.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:recipientId', auth, createConnectionRequest);
router.get('/inbox', auth, getInbox);
router.patch('/:requestId/approve', auth, approveRequest);
router.patch('/:requestId/deny', auth, denyRequest);
router.delete('/:recipientId', auth, deleteConnectionRequest);

export default router;