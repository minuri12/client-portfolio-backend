import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected gracefully');
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err);
  }
};

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'Backend/uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Portfolio Backend API',
    status: 'Server is running successfully'
  });
});

// Import routes
import { userRoutes } from './Backend/routes/user-routes.js';
import { blogRoutes } from './Backend/routes/blog-routes.js';

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Start server for local development
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

// Export app for Vercel
export default app;