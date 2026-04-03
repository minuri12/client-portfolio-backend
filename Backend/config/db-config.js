import mongoose from "mongoose";

// MongoDB connection configuration
const options = {
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 5,
    
    // Timeout settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Automatically build indexes
    autoIndex: true,
};

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
        
        // Handle connection events
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

// Graceful shutdown
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB disconnected gracefully');
    } catch (err) {
        console.error('Error disconnecting from MongoDB:', err);
    }
};