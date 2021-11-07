import mongoose from "mongoose";

import moment from 'moment';

const goalSchema = mongoose.Schema(
  {
    title: { type: String },
    movement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movement",
    },
    EDBmovement: {
      type: String,
      minLength: [
        4,
        "EDB movement id too short: must be 4 characters in length",
      ],
      maxLength: [
        4,
        "EDB movement id too long: must be 4 characters in length",
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'A goal must have a user'],
    },
    resistance: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 1,
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
