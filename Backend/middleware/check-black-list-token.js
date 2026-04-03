import BlackListToken from "../models/user/black-list-token-model.js";
import { sendErrorResponse } from "../utils/response-util.js";

/**
 * Middleware to check if an incoming JWT is blacklisted.
 * If blacklisted, the request is blocked; otherwise, proceeds to next middleware.
 */
export const verifyTokenNotBlacklisted = async (req, res, next) => {
  try {
    // Extract token from "Authorization" header (Bearer <token>)
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];

    // If no token is present, just continue (other middleware may handle missing tokens)
    if (!accessToken) {
      return next();
    }

    // Check blacklist collection for the token
    const blacklistedToken = await BlackListToken.findOne({ token: accessToken }).lean();
    if (blacklistedToken) {
      return sendErrorResponse(res, 401, "Access token has been revoked.");
    }

    next(); // Token is not blacklisted, proceed
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};