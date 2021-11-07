import mongoose from "mongoose";

const exerciseSubSchema = mongoose.Schema({
  EDBmovement: {
    type: String
  },
  movement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movement",
  },
  index: { type: Number, required: true },
  reps: Number,
  sets: Number,
  resistance: Number,
}, { _id: false });

const planSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    image: String,
    exercises: [exerciseSubSchema],
    tags: [String],
    equipment: [String],
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

planSchema.virtual("estimatedDuration").get(function () {
  if (this.exercises.length > 0) {
    const reducer = (accumulator, exercise) =>
      accumulator + (exercise.reps * 3 + 30) * exercise.sets;
    return this.exercises.reduce(reducer);
  } else {
    return 0;
  }
});

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
