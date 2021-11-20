import mongoose from "mongoose";

import Performance from './performance.model.js';

const movementSchema = mongoose.Schema(
  {
    EDB: { type: String },
    title: { type: String },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bodyPart: { type: String },
    targets: [{ type: String }],
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
    resistance: {
      min: Number,
      max: Number,
      recommended: Number,
    },
    source: { type: String, default: "original" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

movementSchema.virtual('name').get(function () {
  return this.title;
});

movementSchema.virtual('target').get(function () {
  return this.targets[0];
});

movementSchema.virtual('gifUrl').get(function () {
  return this.image;
});

movementSchema.method('popularity', function () {
  return this.likes.length;
});

movementSchema.method('ubiquity', async function () {
  return await Performance.count({
    attempts: { $in: { movement: this._id }}
  });
})

const Movement = mongoose.model("Movement", movementSchema);

export default Movement;
