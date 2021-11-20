import express from 'express';

import {
  createConnectionRequest,
  deleteConnectionRequest
} from '../controllers/connectionRequest.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:recipientId', auth, createConnectionRequest);
router.delete('/:recipientId', auth, deleteConnectionRequest);

export default router;