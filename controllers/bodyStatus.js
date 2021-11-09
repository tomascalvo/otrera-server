import mongoose from "mongoose";
import BodyStatus from "../models/bodyStatus.model.js";

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

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .send(
        `${userId} is not a valid mongoose ObjectId. Cannot post new body status(es).`
      );
  } else {
    console.log(`ObjectId passes validation: ${id}`);
  }
}

export async function getBodyStatusRecordsByUserIdForAllRegions(id) {
  console.log('getBodyStatusRecordsByUserIdForAllRegions helper method called');
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
    console.log('an error has occurred in getBodyStatusRecordsByUserIdForAllRegions()');
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

export const createBodyStatusesByUser = async (req, res) => {
  // VALIDATE USER ID
  const { id: userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(404)
      .send(
        `No user with id: ${userId} exists in db. Cannot post new body statuses.`
      );
  }

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
    const bodyStatusesObject = await getBodyStatusRecordsByUserIdForAllRegions(
      userId
    );

    res.status(201).json(bodyStatusesObject);
  } catch (error) {
    res.status(409).json({
      message: error.messsage,
    });
  }
};

export const getCurrentBodyStatusesByUser = async (req, res) => {

  console.log('getCurrentBodyStatusesByUser controller called');
  
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
