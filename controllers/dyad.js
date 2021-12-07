import mongoose from "mongoose";

import Dyad from "../models/dyad.model.js";
import { authenticateRequest, validateObjectId } from "./helperMethods.js";

export const createDyad = async (req, res) => {
  console.log(
    `createDyad controller invoked for userId: ${req.userId} and otherId: ${req.params.otherId}`
  );
  const { userId } = req;
  const { otherId } = req.params;
  try {
    const dyadExists = await Dyad.findOne({
      'monads.user': { $in: [userId, otherId] },
    });
    if (dyadExists) {
      console.log(
        `A dyad already exists for userId ${userId} and otherId ${otherId}.`
      );
      // console.log('dyadExists:');
      // console.dir(dyadExists);
      return res
        .status(409)
        .json({
          message: `A dyad already exists for userId ${userId} and otherId ${otherId}.`,
        });
    }
    const newDyad = new Dyad({
      monads: [{ user: userId }, { user: otherId }],
    });
    // console.log("newDyad:");
    // console.dir(newDyad);
    await newDyad.save();
    res.status(201).send(newDyad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDyads = async (req, res) => {
  // console.log('getDyads controller invoked');
  try {
    const { _id: userId } = await authenticateRequest(req);
    const collectionExists = await Dyad.findOne();
    if (!collectionExists) {
      console.log("No dyad collection exists in db.");
      return res.status(404).json({ message: "No dyad collection exists in db." });
    }
    console.log(`userId: ${userId}`);
    const dyads = await Dyad.find(
      {
        monads: { user: userId },
      }
    ).populate("monads.user");
    res.status(200).send(dyads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDyad = async (req, res) => {
  console.log('deleteDyad controller invoked');
  try {
    await authenticateRequest(req);
    const {dyadId} = req.params;
    validateObjectId(dyadId);
    const deletedDyad = await Dyad.findByIdAndDelete(dyadId);
    if (!deletedDyad) {
      return res.status(404).json({ message: error.message });
    } else {
      return res.status(202).json(deletedDyad);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}