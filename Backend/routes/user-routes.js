import express from "express";
import { getAllUsers, getUserById, getUserRole, registerUser, loginUser, refreshAccessToken } from "../controllers/user-controller.js";
import { authenticateToken } from "../middleware/verify-token.js";
import { authorizeRoles } from "../middleware/role-authorize.js";
import { verifyTokenNotBlacklisted } from "../middleware/check-black-list-token.js";


const router = express.Router();

// Public route — no authentication required
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

router.get(
  "/",
  //verifyTokenNotBlacklisted,
  //authenticateToken,
  //authorizeRoles([userRoles.SUPER_ADMIN.value]),
  getAllUsers
);

router.get(
  "/user-role",
  verifyTokenNotBlacklisted,
  authenticateToken,
  getUserRole
);

router.get(
  "/details",
  verifyTokenNotBlacklisted,
  authenticateToken,
  getUserById
);

export { router as userRoutes }