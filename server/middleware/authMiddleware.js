import admin from "firebase-admin";
import User from "../models/User.js";

/**
 * Middleware: verifyFirebaseToken
 * ─────────────────────────────────
 * Extracts the Firebase ID token from:
 *   1. HTTP-only cookie "authToken" (primary — secure, not accessible to JS)
 *   2. Authorization header "Bearer <token>" (fallback — for API testing / mobile)
 *
 * Verifies it with Firebase Admin SDK and attaches the corresponding
 * Mongoose User document to `req.user`.
 *
 * Rejects with 401 if token is missing/invalid, or if the user
 * document does not exist in MongoDB.
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Priority 1: HTTP-only cookie (most secure — not readable by client JS)
    let idToken = req.cookies?.authToken;

    // Priority 2: Authorization header (fallback for Postman / mobile clients)
    if (!idToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        idToken = authHeader.split("Bearer ")[1];
      }
    }

    if (!idToken) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    // Verify the Firebase token server-side
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Find the corresponding user in MongoDB
    const user = await User.findOne({ googleId: decodedToken.uid });

    if (!user) {
      return res.status(401).json({ error: "User not found. Please log in first." });
    }

    // Attach the full Mongoose user document to the request
    req.user = user;
    req.firebaseUid = decodedToken.uid;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired. Please sign in again." });
    }

    return res.status(401).json({ error: "Invalid or expired authentication token" });
  }
};

export default verifyFirebaseToken;
