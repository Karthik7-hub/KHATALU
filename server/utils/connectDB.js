import mongoose from "mongoose";

// Cached connection promise for Vercel serverless (avoids reconnecting on every invocation)
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  try {
    cachedConnection = await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
    return cachedConnection;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    cachedConnection = null;
    throw err;
  }
};

export default connectDB;
