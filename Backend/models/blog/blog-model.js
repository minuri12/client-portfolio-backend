import mongoose from "mongoose";
import { BLOG_CATEGORIES } from "../../utils/blog-enums.js";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: BLOG_CATEGORIES,
      required: true,
      lowercase: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from title before saving
blogSchema.pre("save", async function () {
  if (this.isModified("title") || this.isNew) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") +
      "-" +
      this._id.toString().slice(-6);
  }
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
