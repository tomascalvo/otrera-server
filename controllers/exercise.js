import Exercise from '../models/exercise.model.js';

export const createExercise = async (req, res) => {
    const exerciseData = req.body;
    const newExercise = new Exercise(exerciseData);
    try {
        await newExercise.save();
        res.status(201).json(newExercise);
    } catch (error) {
        res.status(409).json({
            message: error.message
        });
    }
}

export const getExercises = async (req, res) => {
    try {
        const exercises = await Exercise.find();
        res.status(200).json(exercises);
    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
}
