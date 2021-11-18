// controllers are route handlers that abstract complex logic from routes

import Movement from "../models/movement.model.js";
import { EDBmovements } from "../index.js";

import { authenticateRequest, validateMovementId } from "./helperMethods.js";

export const createMovement = async (req, res) => {
  // console.log('createMovement controller called');
  const movementData = req.body;
  const newMovement = new Movement(movementData);
  try {
    await newMovement.save();
    res.status(201).json(newMovement);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getMovements = async (req, res) => {
  try {
    const MDBmovements = await Movement.find();
    res.status(200).json([...MDBmovements, ...EDBmovements]);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getMovementById = async (req, res) => {
  console.log(`controller getMovementById invoked`);
  console.log("req.params.id:");
  console.log(req.params.id);
  try {
    const collectionExists = await Movement.findOne();
    console.log("Movement collectionExists:");
    console.dir(collectionExists);
    if (collectionExists) {
      const movement = await Movement.findById(req.params.id);
      console.log(`movement:`);
      console.dir(movement);
      if (movement) {
        return res.status(200).json(movement);
      }
    }
    const EDBmovement = EDBmovements.find((EDBmovement) => {
      return EDBmovement.id === req.params.id;
    });
    console.log("EDBmovement:");
    console.dir(EDBmovement);
    if (EDBmovement) {
      return res.status(200).json(EDBmovement);
    } else {
      res.status(404).json({ message: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDefaultMovements = async (req, res) => {
  const defaultMovementIds = ["0025", "1457", "0032", "0652", "0043"];
  try {
    const defaultMovements = defaultMovementIds.map((id) => {
      return EDBmovements.find((movement) => {
        return movement.id === id;
      });
    });
    console.log(`defaultMovements.length: ${defaultMovements.length}`);
    res.status(200).json(defaultMovements);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const searchMovements = async (req, res) => {
  console.log("searchMovements controller called");

  try {
    const {
      query: keywords,
      targets: selectedTargets,
      equipment: selectedEquipment,
    } = req.params;

    const { userId } = req;

    console.log(`selectedTargets: ${selectedTargets}`);
    console.log(`typeof selectedTargets: ${typeof selectedTargets}`);
    console.log(`selectedEquipment: ${selectedEquipment}`);
    console.log(`typeof selectedEquipment: ${typeof selectedEquipment}`);
    console.log(`keywords: ${keywords}`);
    console.log(`typeof keywords: ${typeof keywords}`);

    // SEARCH RESULT SORTING ALGORITHM

    // FAVORITE MOVEMENTS
    // TARGETS RECOVERED MUSCLES
    // OTHER FAVORITE MOVEMENTS
    // POPULAR MOVEMENTS
    // TARGETS RECOVERED MUSCLES && USES FAVORITE EQUIPMENT
    // TARGETS RECOVERED MUSCLES
    // USES FAVORITE EQUIPMENT
    // OTHER POPULAR MOVEMENTS
    // NOT FAVORITE, NEVER PERFORMED
    // TARGETS RECOVERED MUSCLES && USES FAVORITE EQUIPMENT
    // TARGETS RECOVERED MUSCLES
    // USES FAVORITE EQUIPMENT
    // THE REST

    // ADD AUTO-INCREMENTING PROPERTIES:
    // POPULARITY: NUMBER OF LIKES, LENGTH OF LIKES ARRAY
    // UBIQUITY: NUMBER OF USES, NUMBER OF PERFORMANCES IN WHICH MOVEMENT APPEARS

    var query = Movement.find();

    if (selectedTargets !== "undefined") {
      console.log(`selectedTargets !== 'undefined'`);
      console.log(
        `adding .where() clause to query for targets: ${selectedTargets}`
      );
      query = query.where({
        targets: { $in: selectedTargets.split("-") },
      });
    }

    if (selectedEquipment !== "undefined" && selectedEquipment !== "all") {
      console.log(`selectedEquipment !== 'undefined'`);
      console.log(
        `adding .where() clause to query for equipment: ${selectedEquipment}`
      );
      query = query.where({
        equipment: selectedEquipment,
      });
    }

    if (keywords !== "undefined") {
      console.log(`keywords !== 'undefined'`);
      console.log(
        `adding .where() clause to query for title: ${keywords}`
      );
      const keywordsSplit =
        keywords !== "undefined" ? keywords.split(" ") : undefined;
      const keywordsRegExp =
        keywordsSplit
          .map((keyword) => {
            return `(?=.*${keyword})`;
          })
          .join() + ".+";
      query = query.where({
        title: new RegExp(keywordsRegExp, "i"),
      });
    }

    const result = await query.sort({ likes: -1 }).limit(32);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const addFavorite = async (req, res) => {
  console.log("addFavorite controller invoked");
  try {
    // authenticate user & get user document
    const { _id: userId } = await authenticateRequest(req);
    // validate movementId
    const { movementId } = req.params;
    const movement = await validateMovementId(movementId);
    console.log("movement has been validated");
    // validate that movementId is not a current favoriteMovement for userId
    if (movement?.likes && movement?.likes.includes(userId)) {
      console.log(`User ${userId} already likes movement ${movementId}`);
      return res
        .status(409)
        .send(`User ${userId} already likes movement ${movementId}`);
    }
    // invoke Model.findByIdAndUpdate() to add movementId to user.favoriteMovements
    console.log("invoking Model.findByIdAndUpdate()");
    console.log(`movementId: ${movementId}`);
    console.log(`userId: ${userId}`);
    const updatedMovement = await Movement.findByIdAndUpdate(
      movementId,
      {
        likes: [...movement.likes, userId],
      },
      {
        // set this option to return the new, updated document rather than the old, original document
        new: true,
      }
    );
    console.log(`updatedMovement:`);
    console.dir(updatedMovement);
    // return updated user document in response
    res.status(200).json(updatedMovement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  console.log("removeFavorite controller invoked");
  try {
    // authenticate user
    const { _id: userId } = await authenticateRequest(req);
    // validate movementId & get movement document
    const { movementId } = req.params;
    console.log(`movementId: ${movementId}`);
    const movement = await validateMovementId(movementId);
    // validate that userId is indeed a like for movement
    if (!movement?.likes.includes(userId)) {
      return res
        .status(409)
        .send(`User ${userId} does not like movement ${movementId}`);
    }
    // invoke User.findByIdAndUpdate to remove movementId from favoriteMovements
    console.log("invoking Model.findByIdAndUpdate()");
    console.log(`movementId: ${movementId}`);
    const updatedMovement = await Movement.findByIdAndUpdate(
      movementId,
      {
        likes: movement?.likes.filter((like) => {
          console.log(`like: ${like}, userId: ${userId}`);
          console.log(`like !== userId: ${like !== userId}`);
          return !userId.equals(like);
        }),
      },
      {
        new: true,
      }
    );
    console.log(`updatedMovement:`);
    console.dir(updatedMovement);
    // return updated user document in response
    res.status(200).json(updatedMovement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
