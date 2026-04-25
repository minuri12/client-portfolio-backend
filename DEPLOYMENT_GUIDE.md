# Vercel Deployment Guide - Client Portfolio Backend

## Overview
This backend has been migrated from local file storage to Cloudinary for image uploads and configured for Vercel serverless deployment.

## Changes Made

### 1. Cloudinary Integration
- **New File**: `Backend/config/cloudinary.js` - Handles Cloudinary configuration and upload logic
- **Updated**: `Backend/middleware/upload.js` - Now uploads to Cloudinary instead of local filesystem
- **Updated**: `Backend/utils/file-util.js` - Now deletes from Cloudinary instead of local filesystem

### 2. Serverless Configuration
- **Updated**: `Backend/config/db-config.js` - Added connection pooling to prevent multiple connections
- **Updated**: `index.js` - Database connection now happens per-request via middleware
- **Removed**: Local file serving (`/uploads` static route)
- **Updated**: `vercel.json` - Configured for proper Vercel deployment

### 3. Dependencies
- Added `cloudinary` package (v2.9.0)

## Required Environment Variables

You **MUST** set these in your Vercel project settings:

```
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio

# Cloudinary (Get these from your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL (optional)
CLIENT_URL=https://your-frontend.vercel.app

# Node Environment (set to production for Vercel)
NODE_ENV=production
```

## Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add all required variables listed above
   - Deploy the project

3. **Test the Deployment**
   - Visit your Vercel deployment URL
   - Test blog creation with image upload
   - Verify images are stored in Cloudinary

## Important Notes

### File Uploads
- Images are now stored in Cloudinary folder: `portfolio/blogs`
- The `req.savedFile` object now contains:
  ```javascript
  {
    url: "https://res.cloudinary.com/...",  // Full Cloudinary URL
    public_id: "portfolio/blogs/filename"    // Cloudinary public ID
  }
  ```

### Database Connections
- MongoDB connections are pooled and reused across requests
- Connection is established once per Lambda instance, not per request
- The `isConnected` flag prevents multiple connections

### Local Development
- Run `npm run dev` for local development
- Server will start on port 5001 (or PORT env variable)
- Database connection and all features work the same locally

### Production (Vercel)
- Server runs in serverless mode
- No `app.listen()` in production
- Database connects per-request via middleware
- Files are served from Cloudinary CDN

## Troubleshooting

### 500 Internal Server Error
1. Check Vercel function logs for specific error
2. Verify all environment variables are set correctly
3. Ensure Cloudinary credentials are valid
4. Check MongoDB connection string

### Image Upload Fails
1. Verify Cloudinary environment variables are set
2. Check file size (max 5MB) and type (JPEG, PNG, WebP, GIF)
3. Ensure request is multipart/form-data

### Database Connection Issues
1. Verify MongoDB URI is correct
2. Check MongoDB network access (IP whitelist)
3. Ensure database user has proper permissions

## Migration from Local Storage

If you have existing blogs with local image paths:
1. Manually upload old images to Cloudinary
2. Update blog documents in MongoDB with new Cloudinary URLs
3. The `deleteFile` function will handle both old local paths (skip) and new Cloudinary URLs

## File Structure
```
client-portfolio-backend/
├── Backend/
│   ├── config/
│   │   ├── cloudinary.js (NEW)
│   │   └── db-config.js (UPDATED)
│   ├── middleware/
│   │   └── upload.js (UPDATED)
│   ├── utils/
│   │   └── file-util.js (UPDATED)
│   └── ... (other files unchanged)
├── index.js (UPDATED)
├── vercel.json (UPDATED)
├── .env.example (NEW)
├── .vercelignore (NEW)
└── package.json (UPDATED)
```

## Support

For issues:
1. Check Vercel deployment logs
2. Review Cloudinary dashboard for upload errors
3. Test locally first with `npm run dev`
4. Verify environment variables are correctly set

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Vercel Node.js Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)