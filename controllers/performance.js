import mongoose from "mongoose";
import Exercise from "../models/exercise.model.js";

import Performance from '../models/performance.model.js';

export const createPerformance = async (req, res) => {
  console.log('createPerformance called');
  const performanceData = req.body;
  const newPerformance = new Performance(performanceData);
  console.log('newPerformance: ', newPerformance);
  try {
    await newPerformance.save();
    console.log("performance saved successfully");
    res.status(201).json(newPerformance);
  } catch (error) {
    console.log('something went wrong in the controller');
    res.status(409).json({ message: error.message });
  }
}

export const getPerformances = async (req, res) => {
  try {
    const performances = await Performance.find();
    res.status(200).json(performances);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const getPerformancesByMovement = async (req, res) => {
  const { userId } = req.params
  const { movementId } = req.params;
  if (typeof movementId === "string" && movementId.length === 4) {
    try {
      const performances = await Performance
        .find({
          'user': userId,
        })
        .select({
          attempts: 1,
          completed: 1,
        })
        .populate({
          path: "attempts",
          populate: {
            path: "exercise",
            match: {
              EDBmovement: movementId
            }
          }
        })
        .sort('completed')
        // .limit(100)
        ;

      const filteredPerformances = performances.filter((performance) => {
        return performance.attempts.some((attempt) => {
          return attempt?.exercise?.EDBmovement;
        })
      });

      const flattenedAttempts = [...filteredPerformances.map((performance) => {
        return performance.attempts.filter((attempt) => {
          return attempt.exercise?.EDBmovement === movementId;
        }).map((attempt) => {
          return attempt.sets.map((set) => {
            return {
              EDBmovement: attempt.exercise.EDBmovement,
              resistance: set.resistance,
              reps: set.reps,
              completed: performance.completed,
            }
          })
        })
      })].flat();

      // console.log('flattenedAttempts: ', flattenedAttempts);

      res.status(200).json(flattenedAttempts);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  } else if (!mongoose.Types.ObjectId.isValid(movementId)) {
    return res.status(404).send(`${id} is an invalid mongoose ObjectId.`);
  }
}

export const getPerformance = async (req, res) => {
  const { id: performanceId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(performanceId)) {
    return res.status(404).send(`${performanceId} is an invalid mongoose ObjectId.`);
  }
  try {
    const performance = await Performance.find();
    res.status(200).json(performance);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}