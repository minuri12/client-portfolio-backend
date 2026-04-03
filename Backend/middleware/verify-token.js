import jwt from "jsonwebtoken";
import { sendErrorResponse } from "../utils/response-util.js";

export const authenticateToken = (req, res, next) => {
  // Extract token from "Authorization" header, format: "Bearer <token>"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]?.trim();

  if (!token) {
    return sendErrorResponse(res, 401, "Access denied. No token provided.");
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    // Fail early if secret key is missing
    return sendErrorResponse(res, 500, "Server configuration error: ACCESS_TOKEN_SECRET is missing.");
  }

  try {
    // Verify token validity and decode payload
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Attach user data to request object
    next(); // Pass control to the next middleware/route handler
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendErrorResponse(res, 401, "Access token expired.", error);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendErrorResponse(res, 401, "Invalid access token.", error);
    }
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};