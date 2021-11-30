import mongoose from "mongoose";

import ConnectionRequest from "../models/connectionRequest.model.js";
import Session from "../models/session.model.js";
import Dyad from "../models/dyad.model.js";
import {
  authenticateRequest,
  validateUserId,
  validateObjectId,
} from "./helperMethods.js";

export const createConnectionRequest = async (req, res) => {
  console.log("createConnectionRequest invoked");
  try {
    await authenticateRequest(req);
    const { userId } = req;
    const { recipientId } = req.params;
    await validateUserId(recipientId);
    console.log("validation step complete");
    const newConnectionRequest = new ConnectionRequest({
      sender: req.userId,
      recipient: req.params.recipientId,
    });
    await newConnectionRequest.save();
    console.log("connectionRequest saved");
    console.log("newConnectionRequest:");
    console.dir(newConnectionRequest);
    return res.status(201).json(newConnectionRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInbox = async (req, res) => {
  try {
    const { _id: userId} = await authenticateRequest(req);
    const userIncomingRequests = await ConnectionRequest.find({
      recipient: userId,
      status: 'pending',
    }).populate({ path: "sender" });
    return res.status(200).json(userIncomingRequests);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const approveRequest = async (req, res) => {
  console.log("approveRequest controller invoked");
  try {
    // validate user._id and connectionRequest._id
    const { _id: userId } = await authenticateRequest(req);
    const requestId = await validateObjectId(req.params.requestId);
    // validate that target connectionRequest exists in db
    const connectionRequestExists = await ConnectionRequest.findById(requestId);
    if (!connectionRequestExists) {
      return res
        .status(404)
        .json({
          message: `No connectionRequest exists with id ${requestId}. Cannot approve connectionRequest.`,
        });
    }
    console.log("connectionRequestExists");
    // find connectionRequest by id and update to change status from 'pending' to 'accepted'
    const approvedRequest = await ConnectionRequest.findByIdAndUpdate(
      { _id: connectionRequestExists._id },
      { status: "approved" },
      { new: true }
    );
    console.log("approvedRequest:");
    console.dir(approvedRequest);
    // create new dyad between current user and request.sender
    const { sender: senderId } = approvedRequest;
    console.log(`userId: ${userId}, senderId: ${senderId}`);
    const newConnection = new Dyad({
      monads: [{ user: userId }, { user: senderId }],
    });
    await newConnection.save();
    console.log("newConnection saved");
    // populate the monads in the new connection
    const populatedConnection = await Dyad.findById(newConnection._id).populate('monads.user');
    // return the approved connectionRequest and the new dyad
    return res.status(201).send({
      approvedRequest,
      newConnection: populatedConnection,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const denyRequest = async (req, res) => {
  try {
    // validate user._id and connectionRequest._id
    const { _id: userId } = await authenticateRequest(req);
    const requestId = await validateObjectId(req.params.requestId);
    // validate that target connectionRequest exists in db
    const connectionRequestExists = await ConnectionRequest.findById(requestId);
    if (!connectionRequestExists) {
      return res
        .status(404)
        .json({
          message: `No connectionRequest exists with id ${requestId}. Cannot deny connectionRequest.`,
        });
    }
    // find connectionRequest by id and update to change status from 'pending' to 'declined'
    const deniedRequest = await ConnectionRequest.findByIdAndUpdate(
      { _id: connectionRequestExists._id },
      { status: "declined" },
      { new: true }
    );
    // return the denied connectionRequest
    return res.status(200).send(deniedRequest);
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
