import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import admin from "firebase-admin";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import connectDB from "./utils/connectDB.js";

dotenv.config();

// ─── Crash Protection (prevents silent exits on Vercel) ─────────────────────
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

// ─── Firebase Admin SDK Initialization ───────────────────────────────────────
const initFirebase = () => {
  // Option 1: Entire service account JSON as a single env var (recommended for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized (from JSON env var)");
      return;
    } catch (err) {
      console.error("❌ Firebase init failed (JSON parse error):", err.message);
      return;
    }
  }

  // Option 2: Individual env vars (fallback)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !firebasePrivateKey || firebasePrivateKey.includes("YOUR_KEY_HERE")) {
    console.log("⚠️  WARNING: Skipping Firebase Admin Initialization.");
    console.log("   Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or individual vars.");
    console.log("   (API requests requiring authentication will fail)");
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
    console.log("✅ Firebase Admin SDK initialized (from individual env vars)");
  } catch (err) {
    console.error("❌ Firebase Admin initialization failed:", err.message);
  }
};

initFirebase();

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
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

// ─── Server Start (for local development) ────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Only start listening when NOT on Vercel (Vercel handles this itself)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to start server:", err.message);
      process.exit(1);
    });
} else {
  // On Vercel, connect eagerly but don't crash if it fails
  connectDB().catch((err) => {
    console.error("⚠️ Initial MongoDB connection failed on Vercel:", err.message);
  });
}

export default app;
