import { sendErrorResponse } from "../utils/response-util.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB overall body
const MAX_FILE_BYTES = 5 * 1024 * 1024;  // 5 MB per file
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Parses a multipart/form-data request without any external dependencies.
 * Populates req.body with text fields and req.savedFile with the uploaded image.
 * Image field name must be "coverImage".
 * Falls through unchanged for non-multipart (JSON) requests.
 */
export const parseMultipart = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  // Pass through JSON / urlencoded requests untouched
  if (!contentType.includes("multipart/form-data")) {
    console.log("Not multipart/form-data, passing through");
    return next();
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) {
    return sendErrorResponse(res, 400, "Missing boundary in multipart Content-Type.");
  }
  const boundary = (boundaryMatch[1] || boundaryMatch[2]).trim();

  const chunks = [];
  let totalSize = 0;

  req.on("data", (chunk) => {
    totalSize += chunk.length;
    if (totalSize > MAX_BODY_BYTES) {
      req.destroy(new Error("Request body exceeds the 10 MB limit."));
      return;
    }
    chunks.push(chunk);
  });

  req.on("error", (err) => {
    if (!res.headersSent) {
      return sendErrorResponse(res, 400, err.message || "Error reading request body.");
    }
  });

  req.on("end", async () => {
    if (res.headersSent) return;
    try {
      const rawBody = Buffer.concat(chunks);
      const fields = {};
      let savedFile = null;

      const delimiter = Buffer.from(`--${boundary}`);
      const parts = splitBuffer(rawBody, delimiter);

      for (const part of parts) {
        if (!part.length) continue;
        const trimmed = part.toString().trim();
        if (trimmed === "--" || trimmed === "") continue;

        const headerBodySplit = indexOfSequence(part, Buffer.from("\r\n\r\n"));
        if (headerBodySplit === -1) continue;

        const headerSection = part.slice(0, headerBodySplit).toString();
        let bodySlice = part.slice(headerBodySplit + 4);
        if (bodySlice.slice(-2).toString() === "\r\n") {
          bodySlice = bodySlice.slice(0, -2);
        }

        const dispositionMatch = headerSection.match(
          /Content-Disposition:[^\r\n]*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i
        );
        if (!dispositionMatch) continue;

        const fieldName = dispositionMatch[1];
        const filename = dispositionMatch[2];
        const mimeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
        const mime = mimeMatch ? mimeMatch[1].trim().toLowerCase() : "";

        // Treat as a file part if it has a filename attribute OR a Content-Type header
        const isFilePart = !!filename || !!mime;

        if (isFilePart) {
          // No bytes → the file input was left empty; skip gracefully
          if (!bodySlice.length) continue;

          if (!mime || !ALLOWED_MIME_TYPES.includes(mime)) {
            return sendErrorResponse(
              res, 400,
              `Invalid image type "${mime}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}.`
            );
          }
          if (bodySlice.length > MAX_FILE_BYTES) {
            return sendErrorResponse(res, 400, "Image size exceeds the 5 MB limit.");
          }

          const { url, public_id } = await uploadToCloudinary(bodySlice, mime);
          savedFile = { url, public_id };
        } else {
          fields[fieldName] = bodySlice.toString();
        }
      }

      req.body = { ...req.body, ...fields };
      if (savedFile) req.savedFile = savedFile;
      console.log("Multipart data parsed successfully:", { fields: Object.keys(fields), savedFile: savedFile ? savedFile.url : null });
      next();
    } catch (err) {
      return sendErrorResponse(res, 400, "Failed to parse request body.", err);
    }
  });
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Split a Buffer by a delimiter Buffer, returning an array of Buffer slices. */
function splitBuffer(buf, delimiter) {
  const parts = [];
  let start = 0;
  let idx = indexOfSequence(buf, delimiter, start);
  while (idx !== -1) {
    parts.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
    idx = indexOfSequence(buf, delimiter, start);
  }
  if (start < buf.length) parts.push(buf.slice(start));
  return parts;
}

/** Find the index of a sub-Buffer inside a Buffer, starting at `offset`. */
function indexOfSequence(buf, seq, offset = 0) {
  outer: for (let i = offset; i <= buf.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) {
      if (buf[i + j] !== seq[j]) continue outer;
    }
    return i;
  }
  return -1;
}