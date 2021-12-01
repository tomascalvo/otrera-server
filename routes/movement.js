import express from "express";

import { 
    createMovement, 
    getMovements,
    getMovementById,
    getDefaultMovements,
    getFavoriteMovements,
    searchMovements,
    addFavorite,
    removeFavorite,
} from "../controllers/movement.js";

import auth from '../middleware/auth.js';

const router = express.Router();

router.post("/", auth, createMovement);
router.get("/", getMovements);
router.get('/:id', getMovementById);
router.get("/default", getDefaultMovements);
router.get('/favorites/:userId', getFavoriteMovements);
router.get("/:query/:targets/:equipment", auth, searchMovements);
router.patch('/addFavorite/:movementId', auth, addFavorite);
router.patch('/removeFavorite/:movementId', auth, removeFavorite);


export default router;
