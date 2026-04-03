import { sendErrorResponse } from "../utils/response-util.js";
import User from "../models/user/user-model.js";

/**
 * Allows access only if the logged-in user's role is included in the allowed roles.
 * @param {Array<string>} allowedRoles - List of permitted user roles.
 */
export const authorizeRoles = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Ensure the request has authenticated user data (set by authentication middleware)
      if (!req.user?.userId) {
        return sendErrorResponse(res, 401, "Unauthorized. No user data found.");
      }

      // Fetch the user from the database
      const user = await User.findById(req.user.userId);

      if (!user) {
        return sendErrorResponse(res, 404, "User not found.");
      }

      // Check if the user's role is allowed
      if (!allowedRoles.includes(user.userRole)) {
        return sendErrorResponse(res, 403, "Access denied. Forbidden.");
      }

      // User is authorized
      next();
    } catch (error) {
      return sendErrorResponse(res, 500, "Internal Server Error", error);
    }
  };
};