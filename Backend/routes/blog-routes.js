import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog-controller.js";
import { authenticateToken } from "../middleware/verify-token.js";
import { verifyTokenNotBlacklisted } from "../middleware/check-black-list-token.js";
import { parseMultipart } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Protected routes — require valid, non-blacklisted access token
router.post(
  "/",
  verifyTokenNotBlacklisted,
  authenticateToken,
  parseMultipart,
  createBlog
);

router.put(
  "/:id",
  verifyTokenNotBlacklisted,
  authenticateToken,
  parseMultipart,
  updateBlog
);

router.delete(
  "/:id",
  verifyTokenNotBlacklisted,
  authenticateToken,
  deleteBlog
);

export { router as blogRoutes };
