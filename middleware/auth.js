import jwt, { decode } from "jsonwebtoken";
import User from "../models/user.model.js";

const auth = async (req, res, next) => {
  const elideToken = (token) => {
    console.log(`typeof token = ${typeof token}`);
    const string = token;
    if (string.length < 32) {
      return token;
    } else {
      return string.slice(0, 4) + "..." + string.slice(-4);
    }
  }
  try {
    console.log("auth middleware invoked");
    const authHeader = req.headers.authorization;
    const authHeaderSplit = authHeader.split(" ");
    console.log(
      `authorization header: ${authHeaderSplit[0] + " " + elideToken(authHeaderSplit[1])}`
    );
    const token = authHeader.split(" ")[1];
    console.log(`token: ...${elideToken(token)}`);
    const isCustomAuth = token.length < 500;
    console.log(`token is custom auth token: ${isCustomAuth}`);
    console.log(isCustomAuth ? 'Token is custom auth token.' : 'Token is googleOauth token');
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
        req.userId = user._id;
      } else {
        console.log(
          "auth middleware error: can't find user with googleId from token"
        );
      }
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

export default auth;
