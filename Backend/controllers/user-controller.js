import User from "../models/user/user-model.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response-util.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePasswords, hashRefreshToken, compareRefreshTokens } from "../utils/auth-util.js";
import { validateUserRegistration, validateUserLogin } from "../validation/auth-validations.js";

/**
 * Controller: Register a new user
 * Validates input, checks for duplicate email, hashes password, and saves the user.
 */
export const registerUser = async (req, res) => {
  try {
    const name = req.body.name || req.body.username || req.body.fullName || req.body.full_name;
    const email = req.body.email || req.body.userEmail || req.body.emailAddress;
    const password = req.body.password;

    // Validate request body
    const errors = validateUserRegistration(req.body);
    if (errors.length > 0) {
      return sendErrorResponse(res, 400, "Validation failed.", errors);
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 409, "Email is already registered.");
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password);

    // Create and persist the new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Issue access token (and optional refresh token) for the newly created user
    if (!process.env.ACCESS_TOKEN_SECRET) {
      return sendErrorResponse(res, 500, "Server configuration error: ACCESS_TOKEN_SECRET is missing.");
    }

    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    let refreshTokenPlain;
    if (process.env.REFRESH_TOKEN_SECRET) {
      refreshTokenPlain = jwt.sign(
        { userId: newUser._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
      );

      // Hash and store the refresh token
      const hashedRefresh = await hashRefreshToken(refreshTokenPlain);
      newUser.refreshToken = hashedRefresh;
      await newUser.save();
    }

    // Return the new user without the password field
    const { password: _, refreshToken, ...userData } = newUser.toObject();

    const responsePayload = { user: userData, token: accessToken };
    if (refreshTokenPlain) responsePayload.refreshToken = refreshTokenPlain;

    return sendSuccessResponse(res, 201, "User registered successfully.", responsePayload);
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

// Controller: Login existing user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    const errors = validateUserLogin(req.body);
    if (errors.length > 0) {
      return sendErrorResponse(res, 400, "Validation failed.", errors);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse(res, 401, "Invalid email or password.");
    }

    // Verify password
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return sendErrorResponse(res, 401, "Invalid email or password.");
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return sendErrorResponse(res, 500, "Server configuration error: ACCESS_TOKEN_SECRET is missing.");
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    let refreshTokenPlain;
    if (process.env.REFRESH_TOKEN_SECRET) {
      refreshTokenPlain = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
      );

      // Hash and store the refresh token
      const hashedRefresh = await hashRefreshToken(refreshTokenPlain);
      user.refreshToken = hashedRefresh;
      await user.save();
    }

    const { password: _, refreshToken, ...userData } = user.toObject();

    const responsePayload = { user: userData, token: accessToken };
    if (refreshTokenPlain) responsePayload.refreshToken = refreshTokenPlain;

    return sendSuccessResponse(res, 200, "Login successful.", responsePayload);
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

// Controller: Refresh access token using a valid refresh token
export const refreshAccessToken = async (req, res) => {
  try {
    // Read refresh token from HTTP-only cookie set by the frontend
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return sendErrorResponse(res, 400, "Refresh token cookie is missing.");
    }

    if (!process.env.REFRESH_TOKEN_SECRET) {
      return sendErrorResponse(res, 500, "Server configuration error: REFRESH_TOKEN_SECRET is missing.");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return sendErrorResponse(res, 401, "Invalid or expired refresh token.", err);
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshToken) {
      return sendErrorResponse(res, 401, "Invalid refresh token.");
    }

    // Compare provided refresh token with stored hashed token
    const isValid = await compareRefreshTokens(refreshToken, user.refreshToken);
    if (!isValid) {
      return sendErrorResponse(res, 401, "Invalid refresh token.");
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return sendErrorResponse(res, 500, "Server configuration error: ACCESS_TOKEN_SECRET is missing.");
    }

    // Issue new access token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
    );

    // Rotate refresh token: issue a new one and store its hash
    let newRefreshPlain;
    if (process.env.REFRESH_TOKEN_SECRET) {
      newRefreshPlain = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
      );

      const newHashed = await hashRefreshToken(newRefreshPlain);
      user.refreshToken = newHashed;
      await user.save();
    }

    const { password: _, refreshToken: storedHash, ...userData } = user.toObject();

    const responsePayload = { user: userData, token: accessToken };
    if (newRefreshPlain) responsePayload.refreshToken = newRefreshPlain;

    return sendSuccessResponse(res, 200, "Token refreshed successfully.", responsePayload);
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

/**
 * Controller: Get all registered users
 * Fetches the complete list of users from the database.
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    // If no users found, return an empty list instead of null
    if (!users || users.length === 0) {
      return sendErrorResponse(res, 404, "No users found.");
    }

    return sendSuccessResponse(res, 200, "User list retrieved successfully.", {
      users,
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};


export const getUserById = async (req, res) => {
  try {
    const id = req.user.userId

    // Find user by ID
    const user = await User.findById(id);

    // If user not found
    if (!user) {
      return sendErrorResponse(res, 404, "User not found.");
    }

    // Return success response
    return sendSuccessResponse(res, 200, "User retrieved successfully.", { user });
  } catch (error) {
    // Handle invalid ObjectId error or other errors
    if (error.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid user ID format.");
    }

    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse(res, 404, "User not found.");
    }

    // If already inactive
    if (!user.isActive) {
      return sendErrorResponse(res, 400, "User is already inactive.");
    }

    // Mark user as inactive
    user.isActive = false;
    await user.save();

    return sendSuccessResponse(res, 200, "User deactivated successfully.", {
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid user ID format.");
    }

    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

export const activateUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return sendErrorResponse(res, 404, "User not found.");
    }

    if (user.isActive) {
      return sendErrorResponse(res, 400, "User is already active.");
    }

    user.isActive = true;
    await user.save();

    return sendSuccessResponse(res, 200, "User reactivated successfully.", {
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return sendErrorResponse(res, 400, "Invalid user ID format.");
    }

    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

// Get the role of the currently authenticated user
export const getUserRole = async (req, res) => {
  try {
    // Extract userId from decoded token (set by authentication middleware)
    const { userId } = req.user;

    // Find the user in the database
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Retrieve the user's role
    const userRole = existingUser.userRole;

    // Send success response with the user role
    return sendSuccessResponse(res, 200, "User role retrieved successfully", {
      userRole,
    });
  } catch (error) {
    // Send generic server error response
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};
