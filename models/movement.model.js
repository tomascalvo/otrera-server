import mongoose from "mongoose";

const movementSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    regions: [{ type: String }],
    equipment: [{ type: String }],
    description: String,
    image: String,
    instructions: [
      {
        text: String,
        image: String,
      },
    ],
    reps: {
      min: Number,
      max: Number,
      recommended: Number,
    },
    sets: {
      min: Number,
      max: Number,
      recommended: Number,
    },
    resistance: Number,
    source: { type: String, default: "original" }
  },
  { timestamps: true }
);

const Movement = mongoose.model("Movement", movementSchema);

export default Movement;
