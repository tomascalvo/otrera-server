import mongoose from "mongoose";
import moment from "moment";

import { EDBmovements } from "../index.js";

// models

import Performance from "../models/performance.model.js";
import Session from "../models/session.model.js";
import Plan from "../models/plan.model.js";
import Movement from "../models/movement.model.js";
// helper methods

import { authenticateRequest, validateMovementId } from "./helperMethods.js";

export const createSession = async (req, res) => {
  try {
    const sessionData = req.body;
    const newSession = new Session(sessionData);
    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const createSingleMovementSession = async (req, res) => {
  console.log("controller createSingleMovementSession invoked");
  try {
    await authenticateRequest(req);
    console.log("request authenticated");
    const movement = await validateMovementId(req.params.movementId);
    console.log("movement validated");
    console.log("movement:");
    console.dir(movement);
    const planData = {
      title: movement?.name || movement?.title,
      creator: req.userId,
      description: `A workout consisting of a single movement: ${
        movement?.name || movement?.title
      }.`,
      image: movement?.gifUrl || movement?.image,
      exercises: [
        {
          EDBmovement:
            req.params.movementId.length === 4
              ? req.params.movementId
              : undefined,
          movement: mongoose.Types.ObjectId.isValid(req.params.movementId)
            ? req.params.movementId
            : undefined,
          index: 0,
        },
      ],
      equipment: [movement?.equipment],
    };
    console.log("planData:");
    console.dir(planData);
    const singleMovementPlan = new Plan(planData);
    console.log("singleMovementPlan:");
    console.dir(singleMovementPlan);
    await singleMovementPlan.save();
    console.log("plan saved");
    const sessionData = {
      plan: singleMovementPlan._id,
      creator: req.userId,
      estimatedDuration: 10,
      isSingleMovementSession: true,
    };
    const singleMovementSession = new Session(sessionData);
    await singleMovementSession.save();
    console.log("session saved");
    res.status(201).json(singleMovementSession);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("plan")
      .populate("leader")
      .populate("attendees");
    res.status(200).json(sessions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getSession = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res
      .status(404)
      .send(
        `${_id} is not a valid Mongoose ObjectId Cannot fetch session by this id.`
      );
  }
  try {
    const session = await Session.findById(_id)
      .populate({
        path: "plan",
        populate: {
          path: "exercises",
          populate: {
            path: "movement",
          },
        },
      })
      .populate("creator")
      .populate("leader")
      .populate("invitees")
      .populate("attendees")
      .lean();

    const populateEDB = {
      ...session,
      plan: {
        ...session.plan,
        exercises: session.plan.exercises.map((exercise) => ({
          ...exercise,
          EDBmovement:
            EDBmovements.find((EDBm) => {
              return EDBm.id === exercise?.EDBmovement;
            }) || exercise?.EDBmovement,
        })),
      },
    };
    // console.log(`populateEDB:`);
    // console.dir({
    //   ...populateEDB,
    //   plan: { ...populateEDB.plan, image: "image" },
    //   creator: {
    //     ...populateEDB.creator,
    //     image: "image",
    //   },
    // });
    res.status(200).json(populateEDB);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const validateUserId = (userId) => {
  // validate userId
  if (!userId) return res.status(403).json({ message: "Unauthenticated" });
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(403).json({ message: "Invalid userId" });
  console.log(`userId ${userId} is valid`);
};

export const getSessionsByPlanAndUser = async (req, res) => {
  console.log(`session.js controller getSessionsByPlanAndUser invoked.`);

  if (!req.userId) return res.status(403).json({ message: "Unauthenticated" });

  const { userId, planId } = req.params;
  // console.log(`userId: ${userId}, planId: ${planId}`);

  // validate userId

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(403).json({ message: "Invalid userId" });

  try {
    const sessions = await Session.find({
      $and: [
        {
          $or: [
            { creator: userId },
            { leader: userId },
            { invitees: userId },
            { attendees: { user: userId } },
          ],
        },
        {
          plan: planId,
        },
      ],
    })
      .populate("plan")
      .populate("leader")
      .populate("attendees")
      .populate("invitees")
      .sort("startTime");

    console.log(`sessions.length: ${sessions.length}`);

    res.status(200).json(sessions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getRecentSessions = async (req, res) => {
  console.log(`session.js controller getRecentSessions invoked`);

  const { userId, planId } = req.params;

  validateUserId(userId);

  try {
    const sessions = await Session.find({
      $and: [
        {
          $or: [
            { creator: userId },
            { leader: userId },
            { invitees: userId },
            { attendees: { user: userId } },
          ],
        },
        {
          plan: planId,
        },
      ],
    })
      .populate("plan")
      .populate("leader")
      .populate("attendees")
      .populate("invitees")
      .sort({ startTime: "descending" })
      .limit(3);

    console.log(`sessions.length: ${sessions.length}`);

    res.status(200).json(sessions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPreviousSessions = async (req, res) => {
  console.log(`getPreviousSessions controller invoked`);
  const { userId } = req.params;
  try {
    const previousSessions = await Session.find({
      $and: [
        {
          $or: [
            { invitees: userId },
            { attendees: { user: userId } },
            { leader: userId },
            { creator: userId },
          ],
        },
        {
          startTime: { $lt: moment().subtract(1, "hours") },
        },
      ],
    })
      .populate("plan")
      .populate("leader")
      .populate("attendees")
      .populate("invitees")
      .sort("startTime");
    res.status(200).json(previousSessions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUpcomingSessions = async (req, res) => {
  console.log(`getUpcomingSessions controller invoked`);

  const { userId } = req.params;
  try {
    const sessions = await Session.find({
      $and: [
        {
          $or: [
            { invitees: userId },
            { attendees: { user: userId } },
            { leader: userId },
            { creator: userId },
          ],
        },
        {
          startTime: { $gte: moment().subtract(1, "hours") },
        },
        {
          isSingleMovementSession: false,
        },
      ],
    })
      .populate("plan")
      .populate("leader")
      .populate("attendees")
      .populate("invitees")
      .sort("startTime");

    const performances = await Performance.find({
      $and: [
        {
          session: { $in: sessions.map((session) => session.id) },
        },
        {
          completed: { $ne: undefined },
        },
      ],
    });

    const incompleteSessions = sessions.filter((session) => {
      return !performances.find((performance) => {
        if (performance.session.toString() === session.id) {
          return true;
        } else {
          return false;
        }
      });
    });

    res.status(200).json(incompleteSessions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
