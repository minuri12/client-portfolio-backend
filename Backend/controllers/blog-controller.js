import Blog from "../models/blog/blog-model.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response-util.js";
import mongoose from "mongoose";
import { BLOG_CATEGORIES } from "../utils/blog-enums.js";
import { deleteFile } from "../utils/file-util.js";

/**
 * Controller: Create a new blog post
 * Protected — requires authentication
 */
export const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, category, isPublished, coverImage } = req.body;

    if (!title || !content) {
      return sendErrorResponse(res, 400, "Title and content are required.");
    }

    if (!category || !BLOG_CATEGORIES.includes(category.toLowerCase())) {
      return sendErrorResponse(res, 400, `Category is required and must be one of: ${BLOG_CATEGORIES.join(", ")}.`);
    }

    // Use file uploaded in this request, or a path string passed in the body
    const coverImagePath = req.savedFile
      ? req.savedFile.url
      : (typeof coverImage === "string" ? coverImage.trim() : "");

    const blog = new Blog({
      title,
      content,
      excerpt: excerpt || "",
      coverImage: coverImagePath,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
      category: category.toLowerCase(),
      isPublished: isPublished === "true" || isPublished === true,
    });

    await blog.save();

    return sendSuccessResponse(res, 201, "Blog created successfully.", { blog });
  } catch (error) {
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, "A blog with a similar title already exists. Please use a different title.");
    }
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

/**
 * Controller: Get all blog posts
 * Public — supports query params: ?published=true|false&tag=<tag>&category=design|our-mind|others&page=1&limit=10
 */
export const getAllBlogs = async (req, res) => {
  try {
    const { published, tag, category, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (published !== undefined) {
      filter.isPublished = published === "true";
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (category) {
      if (!BLOG_CATEGORIES.includes(category.toLowerCase())) {
        return sendErrorResponse(res, 400, `Invalid category. Must be one of: ${BLOG_CATEGORIES.join(", ")}.`);
      }
      filter.category = category.toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return sendSuccessResponse(res, 200, "Blogs retrieved successfully.", {
      blogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

/**
 * Controller: Get a single blog by ID or slug
 * Public
 */
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Support lookup by either MongoDB ObjectId or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const blog = await Blog.findOne(query).lean();

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found.");
    }

    return sendSuccessResponse(res, 200, "Blog retrieved successfully.", { blog });
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

/**
 * Controller: Update an existing blog post
 * Protected — requires authentication
 */
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, category, isPublished, coverImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, "Invalid blog ID.");
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found.");
    }

    // Apply updates only for provided fields
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (tags !== undefined) {
      blog.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim());
    }
    if (isPublished !== undefined) blog.isPublished = isPublished === "true" || isPublished === true;
    if (category !== undefined) {
      if (!BLOG_CATEGORIES.includes(category.toLowerCase())) {
        return sendErrorResponse(res, 400, `Invalid category. Must be one of: ${BLOG_CATEGORIES.join(", ")}.`);
      }
      blog.category = category.toLowerCase();
    }
    // Replace cover image — delete old file if a new file was uploaded in this request
    if (req.savedFile) {
      const oldImage = blog.coverImage;
      blog.coverImage = req.savedFile.url;
      deleteFile(oldImage);
    } else if (coverImage !== undefined && coverImage !== blog.coverImage) {
      // A new path string was provided without a file upload
      const oldImage = blog.coverImage;
      blog.coverImage = coverImage;
      deleteFile(oldImage);
    }

    await blog.save();

    return sendSuccessResponse(res, 200, "Blog updated successfully.", { blog });
  } catch (error) {
    if (error.code === 11000) {
      return sendErrorResponse(res, 409, "A blog with a similar title already exists. Please use a different title.");
    }
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};

/**
 * Controller: Delete a blog post
 * Protected — requires authentication
 */
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, "Invalid blog ID.");
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return sendErrorResponse(res, 404, "Blog not found.");
    }

    // Clean up cover image from disk
    if (blog.coverImage) deleteFile(blog.coverImage);

    return sendSuccessResponse(res, 200, "Blog deleted successfully.", null);
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error", error);
  }
};
