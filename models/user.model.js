import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    email: { type: String, required: true },
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    googleId: { type: String },
    image: String,
    password: { type: String },
    favoriteMovements: [
      {
        type: String
      },
    ],
    bannedExercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    microcurrency: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

userSchema.virtual("name").get(function () {
  return this.firstName + " " + this.lastName;
});

const User = mongoose.model("User", userSchema);

export default User;
