import mongoose from "mongoose";

const dyadSchema = mongoose.Schema(
  {
    monads: [
      {
        _id: false,
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "A dyad.monad must have a user property."],
        },
        isTrainer: { type: Boolean, default: false },
        isTrainee: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const Dyad = mongoose.model("Dyad", dyadSchema);

export default Dyad;
