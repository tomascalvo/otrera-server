import mongoose from "mongoose";

import ConnectionRequest from "../models/connectionRequest.model.js";
import { authenticateRequest, validateUserId, validateObjectId } from "./helperMethods.js";

export const createConnectionRequest = async (req, res) => {
  console.log('createConnectionRequest invoked');
  try {
    const { userId } = req;
    const { recipientId } = req.params;
    await authenticateRequest(req);
    await validateUserId(recipientId);
    console.log('validation step complete');
    const newConnectionRequest = new ConnectionRequest({
      sender: req.userId,
      recipient: req.params.recipientId,
    });
    await newConnectionRequest.save();
    console.log('connectionRequest saved');
    console.log('newConnectionRequest:');
    console.dir(newConnectionRequest);
    return res.status(201).json(newConnectionRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteConnectionRequest = async (req, res) => {
  try {
    const { userId } = req;
    const { recipientId } = req.params;
    await authenticateRequest(req);
    await validateUserId(recipientId);
    const deletedCR = await ConnectionRequest.findOneAndDelete({
      sender: userId,
      recipient: recipientId,
    });
    if (!deletedCR) {
      return res.status(404).json({ message: error.message });
    } else {
      return res.status(202).json(deletedCR);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
