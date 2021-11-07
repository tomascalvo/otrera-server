import express from "express";

import { 
    createMovement, 
    getMovements,
    getDefaultMovements,
    searchMovements,
} from "../controllers/movement.js";

import auth from '../middleware/auth.js';

const router = express.Router();

router.post("/", auth, createMovement);
router.get("/", getMovements);
router.get("/default", getDefaultMovements);
router.get("/:query/:target/:equipment", searchMovements);

export default router;
