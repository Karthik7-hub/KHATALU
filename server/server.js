import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import admin from "firebase-admin";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

dotenv.config();

// ─── Firebase Admin SDK Initialization ───────────────────────────────────────
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !firebasePrivateKey || firebasePrivateKey.includes("YOUR_KEY_HERE")) {
  console.log("⚠️  WARNING: Skipping Firebase Admin Initialization.");
  console.log("   Missing or invalid valid credentials in server/.env");
  console.log("   (API requests requiring authentication will fail)");
} else {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (err) {
    console.error("❌ Firebase Admin initialization failed:", err.message);
  }
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Bill Manager API is running" });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/category", categoryRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Database Connection & Server Start ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

export default app;
