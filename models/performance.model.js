import mongoose from "mongoose";

const performanceSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    attempts: [
      {
        _id: false,
        movement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Movement",
          required: [true, 'A performance.attempt must have a movement property.'],
        },
        sets: [
          {
            _id: false,
            resistance: Number,
            reps: { type: Number, required: true, default: 0 },
            attempted: {
              type: Date,
              required: [
                true,
                "'attempted' field is required to record the date that the set was performed",
              ],
            },
          },
        ],
      },
    ],
    completed: { type: Date, default: new Date() },
  },
  { timestamps: true }
);

const Performance = mongoose.model("Performance", performanceSchema);

export default Performance;
