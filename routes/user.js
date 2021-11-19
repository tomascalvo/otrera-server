import express from "express";

import {
    createUser,
    signup,
    signin,
    googleSignin,
    getUsers,
    getUser,
    suggestConnections,
} from '../controllers/user.js';

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', createUser);
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/googleSignin', googleSignin);
router.get('/suggestions', auth, suggestConnections);
router.get('/', auth, getUsers);
router.get('/:userId', auth, getUser);

export default router;