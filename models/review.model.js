import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    workout: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan" },
    reviews: [
      {
        exercise: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
        isLike: Boolean,
        comment: String,
      },
    ],
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
