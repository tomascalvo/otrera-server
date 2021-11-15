import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "A new workout session must have a workout plan."]
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startTime: { type: Date, default: Date.now },
    estimatedDuration: Number,
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        arrival: { type: Date },
        completion: { type: Date },
        departure: { type: Date },
      }
    ],
    leaderNote: { type: String },
    isSingleMovementSession: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

sessionSchema.virtual("actualDuration").get(function () {
  const firstArrival = Math.min(
    this.attendees.map((attendee) => {
      return attendee.arrival;
    })
  );
  const lastDeparture = Math.max(
    this.attendees.map((attendee) => {
      return attendee.arrival;
    })
  );
  const duration = (lastDeparture - firstArrival) * 0.001 * (1 / 60);
  return duration;
});

sessionSchema.virtual("isInProgress").get(function () {
  return this.attendees.find(
    (attendee) => !(attendee.departure > attendee.arrival)
  );
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;