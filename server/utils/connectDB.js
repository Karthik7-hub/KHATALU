import mongoose from "mongoose";

/**
 * Cached connection promise for Vercel serverless functions.
 * On Vercel, each invocation may reuse the same Node.js process ("warm start"),
 * so we cache the connection promise to avoid creating new connections each time.
 * On cold starts, a fresh connection is established.
 */
let cachedPromise = null;

const connectDB = async () => {
  // Already connected — return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection in progress — reuse the existing promise
  if (cachedPromise) {
    await cachedPromise;
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  try {
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,  // Fail fast if server unreachable
      socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
    });
    await cachedPromise;
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    cachedPromise = null; // Reset so next call retries
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
};

export default connectDB;
