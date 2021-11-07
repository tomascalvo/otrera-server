import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";

export const createUser = async (req, res) => {
  const userData = req.body;
  const newUser = new User(userData);
  try {
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const signup = async (req, res) => {
  const { email, password, passwordConfirmation, firstName, lastName, image } =
    req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }
    if (password !== passwordConfirmation) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    //  hash the password. don't store passwords in plain text
    // salt = 12
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      image,
    });
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      "jwtSecretTest",
      { expiresIn: "1h" }
    );
    res.status(200).json({ user: newUser, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong with signup (server side)." });
  }
};

export const signin = async (req, res) => {
  console.log("signin controller reached");
  const { email, password } = req.body;
  console.log('email: ', email);
  console.log('password: ', password);
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        message: "That email is not registered to an Otrera user account.",
      });
    }
    console.log('user account found');
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    console.log('isPasswordCorrect: ', isPasswordCorrect);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    console.log('password is correct');
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      "jwtSecretTest",
      { expiresIn: "1h" }
    );
    res.status(200).json({ user: existingUser, token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong with signin (server side)." });
  }
};

export const googleSignin = async (req, res) => {
  const {
    profile: {
      email,
      familyName: lastName,
      givenName: firstName,
      googleId,
      imageUrl: image,
    },
    googleToken,
  } = req.body;

  try {
    const userByGoogleId = await User.findOne({ googleId: googleId });
    if (userByGoogleId) {
      console.log('user account found with googleId');
      if (!userByGoogleId?.image && image) {
        // add google image to existingUser
        const updatedUser = await User.findByIdAndUpdate(
          userByGoogleId._id,
          {
            googleId: googleId,
            image,
          },
          {
            new: true,
          }
        );
        console.log('updated user declared');
        return res.status(201).json({ user: updatedUser, token: googleToken });
      } else {
        return res.status(200).json({ user: userByGoogleId, token: googleToken });
      }
    }
    const userByEmail = await User.findOne({ email: email });
    if (userByEmail) {
      // add googleId and google image to existingUser
      const updatedUser = await User.findByIdAndUpdate(
        userByEmail._id,
        {
          googleId: googleId,
          image,
        },
        {
          new: true,
        }
      );
      return res.status(201).json({ user: updatedUser, token: googleToken });
    } else {
      const newUser = new User({
        email,
        lastName,
        givenName,
        googleId,
        imageUrl,
      });
      await newUser.save();
      res.status(201).json({ user: newUser, token: googleToken });
    }
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong with google signin (server side).",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  // VALIDATE USER ID
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(404)
      .send(
        `No user with id: ${userId} exists in db. Cannot post new body statuses.`
      );
  }

  try {
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
