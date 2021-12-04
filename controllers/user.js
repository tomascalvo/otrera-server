import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import ConnectionRequest from "../models/connectionRequest.model.js";
import Dyad from "../models/dyad.model.js";

import { authenticateRequest, validateMovementId } from "./helperMethods.js";
import projectTitle from '../projectTitle.js';

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
  console.log("email: ", email);
  console.log("password: ", password);
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        message: `That email is not registered to an ${projectTitle.short} user account.`,
      });
    }
    console.log("user account found");
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    console.log("isPasswordCorrect: ", isPasswordCorrect);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    console.log("password is correct");
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
  console.log(
    `googleSignin controller invoked for google user ${req.body.profile?.givenName} ${req.body.profile?.familyName}, googleId: ${req.body.profile.googleId}`
  );

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
      console.log(`User account found with googleId: ${googleId}`);
      if (!userByGoogleId?.image && image) {
        console.log(
          `This ${projecttitle.short} user account has no profile image. Saving google imageUrl to ${projecttitle.short} user account.`
        );
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
        console.log(
          `User ${updatedUser._id} has been updated with an image from google account ${googleId}.`
        );
        return res.status(201).json({ user: updatedUser, token: googleToken });
      } else {
        return res
          .status(200)
          .json({ user: userByGoogleId, token: googleToken });
      }
    } else {
      console.log(
        `${projectTitle.short} doesn't have a user account in the db with googleId ${googleId}. Querying db for an ${projecttitle.short} user account with google account email address ${email}`
      );
      const userByEmail = await User.findOne({ email: email });
      if (userByEmail) {
        console.log(
          `Found an ${projecttitle.short} user account with an email address matching the google Oauth token: ${userByEmail?.email}`
        );
        let updatedUser;
        if (!userByGoogleId?.image && image) {
          console.log(
            `Updating ${projecttitle.short} user account with the googleId and google image of google Oauth token.`
          );
          // add googleId and google image to existingUser
          updatedUser = await User.findByIdAndUpdate(
            userByEmail._id,
            {
              googleId: googleId,
              image,
            },
            {
              new: true,
            }
          );
          return res
            .status(201)
            .json({ user: updatedUser, token: googleToken });
        } else {
          console.log(
            `Updating ${projecttitle.short} user account with the googleId of google Oauth token.`
          );
          // add googleId and google image to existingUser
          updatedUser = await User.findByIdAndUpdate(
            userByEmail._id,
            {
              googleId: googleId,
            },
            {
              new: true,
            }
          );
          return res
            .status(201)
            .json({ user: updatedUser, token: googleToken });
        }
      } else {
        console.log(
          `${projectTitle.short} doesn't have a user account with email address ${email}. Creating a new ${projecttitle.short} user account.`
        );
        const newUser = new User({
          email,
          lastName,
          firstName,
          googleId,
          image,
        });
        await newUser.save();
        res.status(201).json({ user: newUser, token: googleToken });
      }
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
    return res.status(200).json(user);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export const suggestConnections = async (req, res) => {
  // a list of users that are not the current user, not connected to the current user, didn't decline or accept a request from the user

  console.log("suggestConnections controller invoked");
  try {
    const { _id: userId } = await authenticateRequest(req);
    const currentConnections = await Dyad.find({
      monads: { user: userId },
    }).lean();
    const currentConnectionsIds = currentConnections.map((dyad) => {
      const otherMonad = dyad.monads.find((monad) => {
        return !monad.user.equals(userId);
      });
      const otherUser = otherMonad.user;
      return otherUser;
    });
    const declinedRecipients = await ConnectionRequest.find({
      sender: req.userId,
      status: { $in: ["declined"] },
    });
    const declinedRecipientsIds = declinedRecipients.map(
      (request) => request.recipient
    );
    const suggestedUsers = await User.find({
      _id: {
        $nin: [userId, ...declinedRecipientsIds, ...currentConnectionsIds],
      },
    }).limit(8);
    const suggestedUsersIds = suggestedUsers.map((suggestedUser) => {
      return suggestedUser._id;
    });
    const pendingSuggestions = await ConnectionRequest.find({
      recipient: { $in: suggestedUsersIds },
      status: "pending",
    });
    const suggestions = suggestedUsers.map((suggestedUser) => {
      return {
        suggestedUser,
        requestStatus: pendingSuggestions.some((pendingSuggestion) => {
          return pendingSuggestion.recipient.equals(suggestedUser._id);
        })
          ? "pending"
          : undefined,
      };
    });
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
