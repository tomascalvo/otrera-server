// controllers are route handlers that abstract complex logic from routes

import Movement from "../models/movement.model.js";
import { EDBmovements } from "../index.js";

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
    const movements = await Movement.find();
    console.log(movements);
    res.status(200).json(movements);
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
      query,
      target: targetMuscle,
      equipment: selectedEquipment,
    } = req.params;
    console.log(`targetMuscle: ${targetMuscle}`);
    console.log(`selectedEquipment: ${selectedEquipment}`);
    console.log(`query: ${query}`);

    const queryStrings = query !== "undefined" ? query.split(" ") : undefined;
    console.log(`queryStrings: ${queryStrings}`);

    if (
      query === "undefined" &&
      targetMuscle === "undefined" &&
      (selectedEquipment === undefined || selectedEquipment === "all")
    ) {
      return res.status(200).json(EDBmovements.slice(0, 20));
    }

    const results = EDBmovements.filter(
      ({ bodyPart, equipment, name: movementName, target }) => {
        const muscleMatch =
          targetMuscle === "undefined" ? true : bodyPart === targetMuscle;

        const equipmentMatch =
          selectedEquipment === "undefined"
            ? true
            : selectedEquipment === equipment;

        const movementTags = [bodyPart, equipment, movementName, target]
          .map((value) => {
            return value.split(" ");
          })
          .flat();

        const queryStringMatch =
          query === "undefined"
            ? true
            : movementTags.some((tag) => {
                return queryStrings.includes(tag);
              });

        return queryStringMatch && muscleMatch && equipmentMatch;
      }
    );
    console.log(`results.length: ${results.length}`);
    const slicedResults = results.slice(0, 20);
    console.log(`slicedResults.length: ${slicedResults.length}`);
    res.status(200).json(slicedResults);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
