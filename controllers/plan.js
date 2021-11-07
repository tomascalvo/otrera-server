import mongoose from "mongoose";
// import axios from "axios";

import User from "../models/user.model.js";
import Plan from "../models/plan.model.js";
import Session from "../models/session.model.js";
import { EDBmovements } from "../index.js";
import { getBodyStatusRecordsByUserIdForAllRegions } from './bodyStatus.js';

export const createPlan = async (req, res) => {
  console.log("createPlan controller invoked");
  try {
    // STEP 0: AUTHENTICATE USER USING req.userId FROM AUTH MIDDLEWARE

    if (!req.userId) return res.json({ message: "Unauthenticated" });
    if (req.userId)
      console.log("user authenticated: ", req.userId, typeof req.userId);

    // STEP 1: CHECK THAT USER HASN'T ALREADY POSTED A PLAN WITH THE SAME TITLE

    const planData = req.body.plan;
    const sessionData = req.body.session;

    console.log("planData: ", {
      ...planData,
      image: planData.image.slice(0, 30) + "...",
    });

    console.log("about to query plans for existing plan with same title");

    await Plan.findOne(
      {
        title: planData.title,
        creator: req.userId,
      },
      function (err, result) {
        if (err) {
          console.log(err);
        } else if (result) {
          return res.json({
            message:
              "User has already published a workout plan with this title. Choose a new title.",
          });
        } else {
          return;
        }
      }
    );

    // STEP 2: SAVE EACH EXERCISE TO DB & PUSH EACH EXERCISEID TO ARRAY

    // const exercises = [];
    // const exerciseData = planData.exercises;

    // await Promise.all(
    //   exerciseData.map(async (exerciseDatum, index) => {
    //     const newExercise = new Exercise(exerciseDatum);
    //     await newExercise.save();
    //     exercises.push({
    //       exercise: newExercise._id,
    //       index,
    //     });
    //   })
    // );

    // STEP 3: SAVE PLAN TO DB

    const newPlan = new Plan({ ...planData, creator: req.userId });
    await newPlan.save();
    let payload = newPlan;

    // STEP 4: SAVE SESSION TO DB IF isSession (REFERENCING PLAN BY ID)

    if (sessionData) {
      const sessionData = {
        ...req.body,
        plan: newPlan._id,
      };
      const newSession = new Session(sessionData);
      await newSession.save();
      // payload = {...newPlan._doc, session: newSession._id };
      payload = { plan: newPlan, session: newSession };
    }

    // STEP 5: SEND RESPONSE WITH newPlan, newSession AS PAYLOAD

    res.status(201).json(payload);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const duplicatePlan = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res
      .status(404)
      .send(`No plan with id: ${_id} exists in db. Cannot duplicate.`);
  }
  try {
    const originalPlan = await Plan.findById(_id);

    // append a number to the end of the original title to signify the duplication

    function signifyDuplication(originalTitle) {
      if (originalTitle.indexOf(")") !== originalTitle.length - 1) {
        return originalTitle + " (2)";
      } else {
        const counter = parseInt(originalTitle[originalTitle.length - 2]) + 1;
        const duplicateTitle =
          originalTitle.slice(0, originalTitle.length - 3) + `(${counter})`;
        return duplicateTitle;
      }
    }

    const duplicatePlan = new Plan({
      _id: new mongoose.Types.ObjectId(),
      title: signifyDuplication(originalPlan.title),
      creator: originalPlan.creator,
      description: originalPlan.description,
      image: originalPlan.image,
      tags: originalPlan.tags,
      exercises: originalPlan.exercises,
    });
    await duplicatePlan.save();

    User.populate(
      duplicatePlan,
      { path: "creator", model: "User" },
      function (err, populatedDuplicate) {
        res.json(populatedDuplicate);
        if (err) {
          res.status(409).json({ message: err.message });
        }
      }
    );
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find()
      .populate("creator")
      .populate({ path: "exercises", populate: { path: "exercise" } });
    res.status(200).json(plans);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPlan = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res
      .status(404)
      .send(`No plan with id: ${_id} exists. Cannot fetch plan by id.`);
  }
  try {
    const plan = await Plan.findById(_id)
      .populate("creator")
      .populate({ path: "exercises", populate: { path: "exercise" } });
    res.status(200).json(plan);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const suggestPlans = async (req, res) => {
  console.log("plan.js controller suggestPlans called");
  const userId = req.userId;
  // console.log("req.userId: ", req.userId);
  const { targetId } = req.params;
  // console.log("req.params.targetId: ", targetId);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(404)
      .send(
        `No user with id: ${userId} exists. Cannot fetch workout plan suggestions.`
      );
  }
  if (targetId !== "me" && !mongoose.Types.ObjectId.isValid(targetId)) {
    return res
      .status(404)
      .send(
        `No user with id: ${targetId} exists. Cannot fetch workout plan suggestions.`
      );
  }
  try {
    const bodyStatus = await getBodyStatusRecordsByUserIdForAllRegions(
      targetId === "me" ? userId : targetId
    );

    // console.log('bodyStatus:');
    // console.dir(bodyStatus);

    if (bodyStatus === []) {
      res.status(200).json([]);
    }
    
    const soreMuscles = Object.keys(bodyStatus)
      .filter((muscle) => {
        return bodyStatus[muscle] !== "recovered";
      })
      .map((muscleName) => {
        if (muscleName.indexOf("-") !== -1) {
          return muscleName.slice(0, muscleName.indexOf("-"));
        } else {
          return muscleName;
        }
      });
    // console.log("soreMuscles: ");
    // console.dir(soreMuscles);
    const suggestions = await Plan.find({
      "exercises.0": { $exists: true },
    })
      .populate("creator")
      .populate({ path: "exercises", populate: { path: "movement" } })
      .lean();
    // console.log("suggestions.length: ");
    // console.dir(suggestions.length);
    const populatedSuggestions = suggestions.map((suggestion) => ({
      ...suggestion,
      exercises: suggestion.exercises.map((exercise) => ({
        ...exercise,
        EDBmovement: EDBmovements.find((EDBmovement) => {
          return EDBmovement.id === exercise.EDBmovement;
        }),
      })),
    }));
    const filteredSuggestions = populatedSuggestions.filter((suggestion) => {
      const musclesWorked = suggestion.exercises.map((exercise) => {
        return exercise?.EDBmovement?.target;
      });
      const worksSoreMuscle = musclesWorked.some((muscleWorked) => {
        return soreMuscles.some((soreMuscle) =>
          soreMuscle.includes(muscleWorked)
        );
      });
      if (worksSoreMuscle) {
        return false;
      } else {
        return true;
      }
    });
    console.log(`plan.js controller suggestPlans filteredSuggestions.length: ${filteredSuggestions.length}`);
    res.status(200).json(filteredSuggestions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  const { id: planId } = req.params;
  const planData = req.body;
  if (!mongoose.Types.ObjecctId.isValid(planId)) {
    return res
      .status(404)
      .send(`${planId} is not a valid mongoose object id. Cannot update plan.`);
  }
  try {
    const originalPlan = await Plan.findById(planId);
    if (originalPlan.creator !== req.userId) {
      return res
        .status(403)
        .send(`User ${req.userId} is not authorized to modify plan ${planId}`);
    }
    // Use option { new: true } to return the document as it is after update is applied rather than as it was before.
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { ...planData, _id: planId },
      { new: true }
    );
    res.status(204).json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id: planId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res
        .status(404)
        .send(`No plan with id: ${planId} exists in db. Cannot delete.`);
    }
    const plan = Plan.findById(planId);
    if (plan.creator !== req.userId) {
      return res
        .status(403)
        .send(`User ${req.userId} is not authorized to delete plan ${planId}`);
    }
    await Plan.findByIdAndRemove(planId);
    res.status(204).json({ message: `Plan ${planId} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
