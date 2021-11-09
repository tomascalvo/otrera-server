import mongoose from "mongoose";

import User from "../models/user.model.js";
import Goal from "../models/goal.model.js";
import Performance from "../models/performance.model.js";

import { EDBmovements } from "../index.js";

export const createGoal = async (req, res) => {
  console.log("createGoal controller called");
  console.log("req.body:");
  console.dir(req.body);
  if (!req.body?.movement && !req.body?.EDBmovement) {
    res
      .status(409)
      .send(`Goal must have a defined movement or a defined EDB movement.`);
    return;
  }
  const goalData = {
    ...req.body,
    user: req.userId,
    movement: req.body?.movement?.length > 4 ? req.body?.movement : undefined,
    EDBmovement:
      req.body?.movement?.length === 4 ? req.body?.movement : undefined,
  };
  console.log("goalData:");
  console.dir(goalData);
  const newGoal = new Goal(goalData);
  try {
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getGoals = async (req, res) => {
  const { id: userId } = req.params;
  try {
    const goals = await Goal.find({ user: userId });
    res.status(200).json(goals);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getGoal = async (req, res) => {
  const { id: goalId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    return res.status(404).send(`${goalId} is an invalid mongoose ObjectId.`);
  }
  try {
    const goal = await Goal.find({ _id: goalId });
    res.status(200).json(goal);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getProgress = async (req, res) => {
  // This controller accepts a user id and returns an array of goals.
  // Each goal in the array returned is similar to the Mongoose goal model but with an additional 'sets' property.
  // goal.sets is an array of objects.
  // Each set is an object:
  // {
  //   EDBmovement,
  //   resistance,
  //   reps,
  //   set,
  //   attempted,
  //   completed,
  // }

  console.log("getProgress controller called");

  // validate userId, targetId

  if (!req.userId) return res.status(403).json({ message: "Unauthenticated" });

  const userId = req.userId;
  const targetId = req.params.userId !== "me" ? req.params.userId : userId;

  console.log(`targetId: ${targetId}`);
  
  try {
    // get an array of all target user goals

    const goals = await Goal.find({ user: targetId })
      .populate("movement")
      .lean();

    // if user has no goals, return an empty array

    if (goals === []) {
      res.status(200).json([]);
    }

    console.log(`User ${targetId} has ${goals.length} goals`);

    // populate goal.EDBmovement property

    const populatedGoals = goals.map((goal) => {
      return {
        ...goal,
        EDBmovement: goal?.EDBmovement
          ? EDBmovements.find((el) => {
              return el.id === goal?.EDBmovement;
            })
          : undefined,
      };
    });

    const progress = [];

    await Promise.all(
      populatedGoals.map(async (goal) => {
        console.log(`Querying performances for goal ${goal.title}`);

        // const onePerformance = await Performance.findOne({ user: targetId });

        // if (onePerformance === null) {
        //   progress.push({
        //     ...goal,
        //     sets: [],
        //   })
        //   return;
        // }

        // get all performances of the movement of the goal, filtered by resistance/reps/sets parameters
        const performances = await Performance.find({
          $and: [
            { user: targetId },
            {
              $or: [
                // {
                //   "attempts.movement": {
                //     $exists: true,
                //     $ne: undefined,
                //     $eq: goal?.movement._id,
                //   },
                // },
                {
                  "attempts.EDBmovement": {
                    $exists: true,
                    $ne: undefined,
                    $eq: goal?.EDBmovement.id,
                  },
                },
              ],
            },
          ],
        })
          .sort("completed")
          .limit(100)
          .lean();

        // if goal has no performances, push an empty array and return

        console.log(
          `${goal.title} performances.length: ${performances.length}`
        );

        if (performances === []) {
          progress.push({
            ...goal,
            sets: [],
          });
          return;
        }

        // filter out performance attempts that don't match the goal movement or goal EDB movement

        const performancesWithFilteredAttempts = [
          ...performances.map((performance) => {
            return {
              ...performance,
              attempts: performance.attempts.filter((attempt) => {
                // console.log("attempt?.movement", attempt?.movement);
                console.log("attempt?.EDBmovement", attempt?.EDBmovement);

                return (
                  (attempt?.movement === goal?.movement?._id && goal?.movement?._id !== undefined) ||
                  (attempt?.EDBmovement === goal?.EDBmovement?.id && goal?.EDBmovement?.id !== undefined)
                );
              }),
            };
          }),
        ];

        console.log(
          `${goal.title} performancesWithFilteredAttempts.length: ${performancesWithFilteredAttempts.length}`
        );

        console.log(
          `${goal.title} attempts:`
        );
        console.dir(performancesWithFilteredAttempts
          .map((el) => {
            return el.attempts;
          })
          .flat());

        // populate EDBmovement data into attempts

        const populatedPerformances = performancesWithFilteredAttempts.map(
          (performance) => ({
            ...performance,
            attempts: performance.attempts.map((attempt) => ({
              ...attempt,
              EDBmovement: attempt?.EDBmovement ? goal?.EDBmovement : undefined,
            })),
          })
        );

        // organize attempts into an array of objects

        const flattenedSets = [
          ...populatedPerformances.map((performance) => {
            return performance.attempts.map((attempt) => {
              return attempt.sets.map((set, i) => {
                return {
                  EDBmovement: attempt?.EDBmovement,
                  movement: attempt?.movement,
                  resistance: set.resistance,
                  reps: set.reps,
                  set: i + 1,
                  attempted: set.attempted,
                  completed: performance.completed,
                };
              });
            });
          }),
        ].flat(2);

        progress.push({
          ...goal,
          sets: flattenedSets,
        });
      })
    );
    res.status(200).json(progress);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  console.log(`deleteGoal called for goal ${req.params.goalId}`);
  try {
    const { goalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res
        .status(404)
        .send(
          `This goalId is not a valid mongoose ObjectId (goalId ${goalId}.)`
        );
    }
    const goal = await Goal.findById(goalId).lean();
    // console.log(`goal:`);
    // console.dir(goal);
    console.log(`goal.user: ${goal.user}`);
    console.log(`typeof goal.user: ${typeof goal.user}`);
    console.dir(goal.user);
    console.log(`req.userId: ${req.userId}`);
    console.log(`typeof req.userId: ${typeof req.userId}`);
    console.dir(req.userId);
    console.log(`goal.user === req.userId: ${goal.user === req.userId}`);
    const requestor = req.userId.toString();
    const goalOwner = goal.user.toString();
    console.log(`goalOwner === requestor: ${goalOwner === requestor}`);
    if (requestor !== goalOwner) {
      return res
        .status(403)
        .send(`User ${req.userId} is not authorized to delete goal ${goalId}.`);
    }
    await Goal.findByIdAndRemove(goalId);
    res.status(204).json({ message: `Goal ${goalId} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
