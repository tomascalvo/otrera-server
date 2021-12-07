import mongoose from "mongoose";
import BodyStatus from "../models/bodyStatus.model.js";
import { validateObjectId } from "./helperMethods.js";

export async function getBodyStatusRecordsByUserIdForAllRegions(id) {
  // console.log("getBodyStatusRecordsByUserIdForAllRegions helper method called");
  // console.log(`getting bodyStatuses for userId ${id}`);
  const documents = [];
  try {
    const regions = await BodyStatus.find().distinct("region");
    // console.log('regions.length: ');
    // console.dir(regions.length);
    if (regions.length === 0) {
      return [];
    }
    await Promise.all(
      regions.map(async (region) => {
        const document = await BodyStatus.findOne({ user: id })
          .where("region")
          .equals(region)
          .sort({ createdAt: -1 })
          .lean();
        // console.log('document: ');
        // console.dir(document);
        if (document !== null) {
          documents.push(document);
        }
      })
    );

    console.log(`documents.length: ${documents.length}`);
    // console.dir(documents);

    if (documents.length === 0) {
      return [];
    }
  } catch {
    console.log(
      "an error has occurred in getBodyStatusRecordsByUserIdForAllRegions()"
    );
  }

  // MAP EACH RECORD TO AN OBJECT { [region]: condition }
  const mappedStatuses = documents.map(({ region, condition }) => ({
    [region]: condition,
  }));
  // console.log('mappedStatuses.length:');
  // console.dir(mappedStatuses.length);

  // REDUCE THE ARRAY OF OBJECTS TO ONE OBJECT
  const bodyStatusesObject = mappedStatuses.reduce((result, current) => {
    return Object.assign(result, current);
  });

  // SEND ONE OBJECT REPRESENTING ALL THE LATEST BodyStatus RECORDS FOR ONE USER IN THE RESPONSE
  return bodyStatusesObject;
}

const saveBodyStatusDocs = async (bodyStatusesObject, userId) => {
  console.log("saveBodyStatusDocs helper method invoked");
  try {
    await Promise.all(
      Object.keys(bodyStatusesObject).map(async (key) => {
        const bodyStatusData = {
          user: userId,
          region: key,
          condition: bodyStatusesObject[key],
        };
        const newBodyStatus = new BodyStatus(bodyStatusData);
        await newBodyStatus.save();
      })
    );
  } catch (error) {
    console.log(error);
    res.status(409).json({
      message: error.message,
    });
  }
};

export const createBodyStatus = async (req, res) => {
  const bodyStatusData = req.body;
  const newBodyStatus = new BodyStatus(bodyStatusData);
  if (req.userId !== bodyStatusData.user) {
    return res
      .status(403)
      .send(
        `User ${req.userId} is not authorized to post bodyStatus updates on behalf of user ${bodyStatusData.user}.`
      );
  }
  try {
    await newBodyStatus.save();
    res.status(201).json(newBodyStatus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const createFullRecovery = async (req, res) => {
  console.log("createFullRecovery controller called");

  // validate user id
  const { userId } = req.params;
  validateObjectId(userId);

  try {
    // get all muscle names
    const allMuscleNames = [
      "skull",
      "hand-left",
      "hand-right",
      "foot-left",
      "foot-right",
      "abductors",
      "adductors-left",
      "adductors",
      "abductors-right",
      "abductors-left",
      "abs",
      "biceps-left",
      "back",
      "biceps",
      "adductors-right",
      "biceps-right",
      "cardio",
      "cardiovascular system",
      "calves-right",
      "calves-left",
      "calves",
      "chest",
      "delts",
      "delts-right",
      "delts-left",
      "forearms",
      "forearms-left",
      "forearms-right",
      "glutes",
      "glutes-left",
      "glutes-right",
      "hamstrings",
      "hamstrings-left",
      "hamstrings-right",
      "lats",
      "lats-left",
      "lats-right",
      "levator scapulae",
      "lower legs",
      "lower arms",
      "neck",
      "pectorals-left",
      "pectorals",
      "pectorals-right",
      "quads",
      "traps",
      "shoulders",
      "serratus anterior-right",
      "serratus anterior-left",
      "traps-left",
      "triceps-left",
      "traps-right",
      "serratus anterior",
      "spine",
      "triceps",
      "undefined-left",
      "triceps-right",
      "upper arms",
      "undefined-right",
      "waist",
      "upper back-right",
      "upper back",
      "upper legs",
      "upper back-left",
    ];
    const fullRecovery = allMuscleNames.reduce((result, currentMuscleName) => {
      return Object.assign(result, { [currentMuscleName]: "recovered" });
    }, {});
    // console.log("fullRecovery:");
    // console.dir(fullRecovery);

    // save a bodyStatus document for each muscle name with status="recovered"
    await saveBodyStatusDocs(fullRecovery, userId);

    // return a confirmation object
    const newBodyStatuses = await getBodyStatusRecordsByUserIdForAllRegions(
      userId
    );
    res.status(201).json(newBodyStatuses);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const createBodyStatusesByUser = async (req, res) => {
  // VALIDATE USER ID
  const { id: userId } = req.params;
  validateObjectId(userId);

  // SAVE BodyStatus FOR EACH REGION MENTIONED IN FORM
  const bodyStatusesData = req.body;
  try {
    await Promise.all(
      Object.keys(bodyStatusesData).map(async (objKey) => {
        const bodyStatusData = {
          user: userId,
          region: objKey,
          condition: bodyStatusesData[objKey],
        };
        const newBodyStatus = new BodyStatus(bodyStatusData);
        await newBodyStatus.save();
      })
    );

    // QUERY DB FOR BodyStatus RECORDS FOR ALL REGIONS
    const newBodyStatuses = await getBodyStatusRecordsByUserIdForAllRegions(
      userId
    );

    res.status(201).json(newBodyStatuses);
  } catch (error) {
    res.status(409).json({
      message: error.messsage,
    });
  }
};

export const getCurrentBodyStatusesByUser = async (req, res) => {
  console.log("getCurrentBodyStatusesByUser controller called");

  // VALIDATE USER ID
  const { id: userId } = req.params;
  validateObjectId(userId);

  try {
    // QUERY DB FOR BodyStatus RECORDS FOR ALL REGIONS
    const bodyStatusesObject = await getBodyStatusRecordsByUserIdForAllRegions(
      userId
    );

    // console.log("bodyStatusesObject: ")
    // console.dir(bodyStatusesObject);

    res.status(200).json(bodyStatusesObject);
  } catch (error) {
    res.status(404).json({
      message: error.messsage,
    });
  }
};
