import mongoose from "mongoose";
import User from "../models/user.model.js";
import Movement from "../models/movement.model.js";
import { EDBmovements } from "../index.js";

export function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send(`${id} is not a valid mongoose ObjectId.`);
  } else {
    console.log(`ObjectId passes validation: ${id}`);
  }
}

export async function authenticateRequest(req) {
  console.log('helper method authenticateRequest invoked');
  const userId = req?.userId;
  if (!userId)
    return res
      .status(401)
      .json({ message: "Unauthenticated: req.userId does not exist" });
  validateObjectId(userId);
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(401)
      .json({ message: `Unauthenticated: no user exists with id ${userId}.` });
  } else {
    console.log("user authenticated: ", req.userId, typeof req.userId);
    return user;
  }
}

export async function validateMovementId(movementId) {
  console.log(
    `validateMovementId helper method invoked for movementId ${movementId}`
  );
  if (movementId.length > 4) {
    validateObjectId(movementId);
    try {
      const movement = await Movement.findById(movementId);
      if (movement) {
        console.log("movement found:");
        console.dir(movement);
        return movement;
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    const EDBmovement = EDBmovements.find((EDBmovement) => {
      return EDBmovement.id === movementId;
    });
    if (EDBmovement) {
      console.log("EDBmovement found");
      return EDBmovement;
    } else {
      console.log(`No movement or EDBmovement with id ${movementId} exists.`);
      return null;
    }
  }
}
