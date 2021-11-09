import jwt, { decode } from "jsonwebtoken";
import User from "../models/user.model.js";

const auth = async (req, res, next) => {
  try {
    console.log('auth middleware invoked');
    console.log(`authorization header: ${req.headers.authorization}`);
    const token = req.headers.authorization.split(" ")[1];
    console.log(`token: ${token}`);
    const isCustomAuth = token.length < 500;
    console.log(`token is custom auth token: ${isCustomAuth}`);
    let decodedData;
    if (token && isCustomAuth) {
      decodedData = jwt.verify(token, "jwtSecretTest");
      req.userId = decodedData?.id;
    } else {
      decodedData = jwt.decode(token);
      // sub is a Google id unique for each user
      const googleId = decodedData?.sub;
      // console.log('googleId', googleId);
      const user = await User.findOne({ googleId }).exec();
      if (user) {
        // console.log('user._id: ', user._id);
        req.userId = user._id
      } else {
        console.log('auth middleware error: can\'t find user with googleId from token');
      }
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

export default auth;
