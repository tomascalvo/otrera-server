import mongoose from "mongoose";

import moment from 'moment';

const goalSchema = mongoose.Schema(
  {
    title: { type: String },
    movement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movement",
      required: [true, 'A goal must have a movement.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'A goal must have a user.'],
    },
    resistance: Number,
    reps: {
      type: Number,
      default: 1,
      required: [true, 'A goal must have at least one rep.'],
    },
    sets: Number,
    start: {
      type: Date,
      default: new Date(),
    },
    finish: {
      type: Date,
      default: moment().add(6, 'M').toDate(),
    },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;
