import { v2 as cloudinary } from "cloudinary";
import "../config/cloudinary.js"; // Ensure Cloudinary is configured

/**
 * Deletes a file from Cloudinary given its public_id or URL.
 * Silently ignores errors if the file does not exist.
 * @param {string} fileIdentifier - The public_id or URL of the file to delete
 */
export const deleteFile = async (fileIdentifier) => {
  if (!fileIdentifier) return;
  
  try {
    let publicId = fileIdentifier;
    
    // If it's a URL, extract the public_id
    // Cloudinary URLs look like: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/portfolio/blogs/filename.jpg
    if (fileIdentifier.includes('cloudinary.com') || fileIdentifier.includes('res.cloudinary.com')) {
      const urlParts = fileIdentifier.split('/');
      // Find the index of 'upload' and get everything after it, removing the version
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        // Get the path after 'upload', skip the version (v1234567890)
        const pathParts = urlParts.slice(uploadIndex + 1);
        // Remove the version part (starts with 'v' followed by numbers)
        const withoutVersion = pathParts.filter((part, idx) => idx !== 0 || !part.startsWith('v'));
        publicId = withoutVersion.join('/');
        // Remove file extension if present
        const lastDotIndex = publicId.lastIndexOf('.');
        if (lastDotIndex > 0) {
          publicId = publicId.substring(0, lastDotIndex);
        }
      }
    } else if (fileIdentifier.startsWith('/')) {
      // Old local file path format - skip deletion as files are no longer stored locally
      console.warn(`[file-util] Skipping deletion of local file (migrated to Cloudinary): ${fileIdentifier}`);
      return;
    }
    
    if (publicId && !publicId.startsWith('/')) {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === "not found") {
        console.warn(`[file-util] File not found in Cloudinary: ${publicId}`);
      } else {
        console.log(`[file-util] Successfully deleted from Cloudinary: ${publicId}`);
      }
    }
  } catch (error) {
    // Non-critical: log but do not throw
    console.warn(`[file-util] Could not delete file from Cloudinary: ${fileIdentifier}`, error.message);
  }
};